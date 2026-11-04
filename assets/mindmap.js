/* Canvas integration. Mind Elixir owns the tree; free elements share its viewport. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), clone = value => JSON.parse(JSON.stringify(value));
  const editing = new URLSearchParams(location.search).get('edit') === '1';
  document.body.dataset.mapMode = editing ? 'edit' : 'view';
  const {validate, MAX_FILE} = window.PaperMindmapDocument || {}, ME = window.MindElixir?.default;
  let mind, doc, items = [], layer, selection = null, db, ready = false, mutating = false;
  let generation = 0, savedGeneration = 0, exportedGeneration = 0, saveTimer, toastTimer, formDirty = false;
  let history = [], historyIndex = -1, connecting = null, hand = false, gesture = null, inline = null;
  let lastPoint = null, imageIntent = null, imageBusy = false, dropTarget = null;
  let pointerOrigin = null, pointerMoved = false;
  let documentRevision = 0;
  const menuTimers = new WeakMap();
  const menuDelay = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 160;
  const uid = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function status(message, error = false, visible = error) {
    const el = $('map-status'); el.textContent = message; el.dataset.error = String(error); el.dataset.visible = String(visible);
    clearTimeout(toastTimer); if (visible && !error) toastTimer = setTimeout(() => { el.dataset.visible = 'false'; }, 4000);
  }
  function report(error) { status(error.message || '操作失败，请重试。', true); }
  function guard(fn) { return async (...args) => { try { if (ready) await fn(...args); } catch (e) { report(e); } }; }
  function textInput(target) { return target instanceof Element && target.closest('input,textarea,select,[contenteditable="plaintext-only"],[contenteditable="true"]'); }
  function snapshot() { return validate({...doc, updated: editing ? today() : doc.updated, data: {...mind.getData(), canvasItems: items}}); }
  function entries() {
    const list = []; const walk = (node, parents=[]) => { list.push({node, parents}); node.children?.forEach(child => walk(child,[...parents,node.id])); };
    walk(mind.nodeData); return list;
  }
  function itemById(id) { return items.find(item => item.node.id === id); }
  function targetNode() {
    if (!selection) return null;
    if (selection.kind === 'item') return itemById(selection.id)?.node || null;
    try { return mind.findEle(selection.id).nodeObj; } catch (_) { return null; }
  }
  function elementForSelected() {
    if (!selection) return null;
    return selection.kind === 'item' ? layer.querySelector(`[data-item-id="${selection.id}"]`) : mind.findEle(selection.id);
  }
  function saveState(text, error=false) { $('map-save-state').textContent=text; $('map-save-state').dataset.error=String(error); }
  async function saveDraft(value, serial) {
    try {
      if (!db) throw new Error('本机存储不可用');
      await draftRequest('readwrite', JSON.parse(value)); savedGeneration=Math.max(savedGeneration,serial);
      if (serial === generation) saveState('已存本机');
    } catch (e) { saveState('未保存',true); status(`草稿未保存：${e.message}。请从更多菜单导出文件。`,true); }
  }
  function commit() {
    if (!ready || !editing || mutating) return;
    const clean=snapshot(), value=JSON.stringify(clean);
    if (history[historyIndex] === value) { render(); return; }
    history=history.slice(0,historyIndex+1); history.push(value);
    let bytes=history.reduce((total,text)=>total+text.length*2,0);
    while (history.length>2 && (history.length>40 || bytes>64*1024*1024)) bytes-=history.shift().length*2;
    historyIndex=history.length-1; doc=clean; items=clean.data.canvasItems;
    generation++; saveState('保存中…'); clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>saveDraft(value,generation),400);
    render();
  }
  function load(value, keepViewport=false) {
    const clean=validate(value);documentRevision++;gesture=null;clearDrop();doc=clean;items=clone(clean.data.canvasItems);
    mutating=true; mind.direction=clean.data.direction; mind.refresh(clone(clean.data)); mind.changeTheme(theme()); mutating=false;
    selection=null; connecting=null; inline=null; $('map-title').textContent=doc.title; $('map-title').title=doc.title;
    render(); if (!keepViewport) fitContent();
  }
  async function readText(file) {
    const buffer = await file.arrayBuffer(), bytes = new Uint8Array(buffer);
    if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(buffer).replace(/^\uFEFF/, '');
    if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(buffer).replace(/^\uFEFF/, '');
    return new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
  }
  async function normalizeJson(value, fileName) {
    if (value && value.format === 'paper-mindmap') return validate(value);
    if (Array.isArray(value) || value?.rootTopic || value?.sheets) {
      if (!window.XMindImport?.parseJson) throw new Error('XMind 导入模块未加载，请保留完整文件后刷新。');
      return window.XMindImport.parseJson(value, fileName);
    }
    const data = value?.data?.nodeData ? value.data : value?.nodeData ? value : value?.topic !== undefined ? {nodeData: value} : null;
    if (data) {
      return validate({format: 'paper-mindmap', version: 2, title: (fileName || '文献导图').replace(/\.json$/i, '') || '文献导图', updated: '',
        data: {nodeData: data.nodeData, direction: [0, 1, 2, 3].includes(data.direction) ? data.direction : 1,
          canvasItems: Array.isArray(data.canvasItems) ? data.canvasItems : []}});
    }
    if (Array.isArray(value?.nodes) && (Array.isArray(value?.edges) || Array.isArray(value?.links))) {
      throw new Error('此文件是知识图谱（nodes/edges），本页只展示思维导图；请上传 .xmind 或导图 JSON。');
    }
    if (Array.isArray(value?.entities) && Array.isArray(value?.relations)) {
      throw new Error('此文件是知识图谱（entities/relations），本页只展示思维导图；请上传 .xmind 或导图 JSON。');
    }
    throw new Error('JSON 不是支持的导图格式：请选择本页导出的 JSON、Mind Elixir 数据或 XMind content.json。');
  }
  async function openFile(file) {
    if (!file) return;
    if (file.size > MAX_FILE) throw new Error('文件不能超过 32 MB。');
    const name = file.name || '导图文件';
    const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const zipped = head[0] === 0x50 && head[1] === 0x4b;
    let value;
    if (zipped || /\.xmind$/i.test(name)) {
      if (!window.XMindImport) throw new Error('XMind 导入模块未加载，请保留完整文件后刷新。');
      value = await window.XMindImport.parse(await file.arrayBuffer(), name);
    } else {
      let parsed;
      try { parsed = JSON.parse(await readText(file)); } catch (_) { throw new Error('文件不是有效的 JSON；请确认文件未损坏并使用 UTF-8 或 UTF-16 编码。'); }
      value = await normalizeJson(parsed, name);
    }
    if (editing) {
      if (!await confirmReplacement('导入将替换本机草稿。需要保留现有内容时，请先取消并导出。')) return;
      load(value); commit();
    } else {
      load(value); $('map-version').textContent = '本文件';
      status(`已打开 ${name} · 刷新页面恢复公开版`, false, true);
    }
  }
  async function transaction(fn) {
    const before=snapshot(); mutating=true;
    try { await fn(); } catch(e) { mutating=false; load(before,true); throw e; }
    mutating=false; commit();
  }
  function undo(redo=false) {
    if (inline) inline.element.blur();
    const next=historyIndex+(redo?1:-1); if (next<0 || next>=history.length) return;
    historyIndex=next; load(JSON.parse(history[next]),true); generation++; saveState('保存中…');
    clearTimeout(saveTimer); const value=history[next],serial=generation; saveTimer=setTimeout(()=>saveDraft(value,serial),400); controls();
  }
  function choose(kind,id) {
    selection=id?{kind,id}:null;
    if (kind !== 'node') mind.clearSelection();
    layer?.querySelectorAll('.map-free-item').forEach(el=>{el.dataset.selected=String(selection?.kind==='item' && el.dataset.itemId===id);});
    controls(); inspector();
  }
  function controls() {
    if (!mind) return;
    const node=targetNode(), tree=selection?.kind==='node' && !!node, root=node?.id===mind.nodeData.id;
    $('map-add-child').disabled=!tree || hand; $('map-add-sibling').disabled=!tree || root || hand;
    $('map-delete').disabled=!node || root || hand; $('map-detach').disabled=!tree || root || !!node.children?.length || hand;
    $('map-connect').disabled=selection?.kind!=='item' || hand; $('map-connect').setAttribute('aria-pressed',String(!!connecting));
    $('map-inspector-toggle').disabled=!node; $('map-undo').disabled=historyIndex<=0; $('map-redo').disabled=historyIndex>=history.length-1;
    if (selection) $('map-node-select').value=`${selection.kind}:${selection.id}`;
  }
  function inspector() {
    if (!editing || $('map-inspector').hidden) return;
    const node=targetNode(); if (!node) { panel('map-inspector',false); return; }
    $('map-node-text').value=node.topic; $('map-node-link').value=node.hyperLink||'';
    let branch=node; while (!branch.branchColor && branch.parent && branch.parent.id!==mind.nodeData.id) branch=branch.parent;
    const index=mind.nodeData.children?.findIndex(child=>child.id===branch.id)??-1;
    $('map-node-color').value=branch.branchColor || (index>=0?theme().palette[index%5]:'#0969da');
    $('map-image-options').hidden=!node.image; $('map-image-width').value=node.image?.width||360; formDirty=false;
  }
  function panel(id,open) {
    $(id).hidden=!open;
    const toggle=id==='map-inspector'?'map-inspector-toggle':'map-find-toggle'; $(toggle).setAttribute('aria-expanded',String(open));
    if (open) { const other=id==='map-inspector'?'map-navigation':'map-inspector'; $(other).hidden=true; $(other==='map-inspector'?'map-inspector-toggle':'map-find-toggle').setAttribute('aria-expanded','false'); }
  }
  function decorate() {
    const rootId=mind.nodeData.id;
    mind.el.querySelectorAll('me-tpc').forEach(topic=>{
      const node=topic.nodeObj;if(!node)return;
      const branch=node.parent?.id===rootId;
      topic.classList.toggle('map-topic-root',node.id===rootId);
      topic.classList.toggle('map-topic-branch',branch);
      topic.classList.toggle('map-topic-paper',/^paper-/.test(node.id));
      topic.classList.toggle('map-topic-description',/^description-/.test(node.id));
      if(branch&&node.branchColor)topic.style.setProperty('--branch-color',node.branchColor);
    });
    mind.el.querySelectorAll('me-tpc img').forEach(image=>{
      image.draggable=false; image.alt=image.closest('me-tpc').nodeObj.topic.split('\n')[0]||'论文配图'; image.tabIndex=0;
      image.setAttribute('role','button');image.setAttribute('aria-label',`放大：${image.alt}`);
    });
    mind.el.querySelectorAll('me-tpc a').forEach(a=>{a.rel='noopener noreferrer';});
    mind.el.querySelectorAll('me-epd').forEach(button=>{
      const node=button.previousElementSibling?.nodeObj;if(!node)return;
      button.tabIndex=0;button.setAttribute('role','button');button.setAttribute('aria-expanded',String(node.expanded!==false));button.setAttribute('aria-label',`${node.expanded===false?'展开':'收起'}：${node.topic.split('\n')[0]}`);
    });
  }
  function renderItems() {
    const focused=document.activeElement?.closest('.map-free-item');
    const focusId=focused?.dataset.itemId,focusResize=document.activeElement?.matches('.map-item-resize');
    const fragment=document.createDocumentFragment();
    for (const item of items) {
      const el=document.createElement('div'); el.className='map-free-item';el.dataset.itemId=item.node.id;el.tabIndex=0;
      el.dataset.selected=String(selection?.kind==='item' && selection.id===item.node.id);
      el.style.left=`${item.x}px`;el.style.top=`${item.y}px`;el.setAttribute('aria-label',item.node.topic.split('\n')[0]||'自由图片');
      if (item.node.branchColor) el.style.borderColor=item.node.branchColor;
      if (item.node.image) {
        const image=document.createElement('img');image.src=item.node.image.url;image.style.width=`${item.node.image.width}px`;image.style.height=`${item.node.image.height}px`;image.alt=item.node.topic||'自由图片';image.draggable=false;el.append(image);
      }
      const text=document.createElement('div');text.className='map-free-text';text.textContent=item.node.topic;Object.assign(text.style,item.node.style||{});
      if (item.node.image && !item.node.topic) text.hidden=true;el.append(text);
      if (item.node.hyperLink) { const a=document.createElement('a');a.href=item.node.hyperLink;a.textContent='打开资源 ↗';a.target='_blank';a.rel='noopener noreferrer';el.append(a); }
      if (editing) {const handle=document.createElement('button');handle.className='map-item-resize';handle.type='button';handle.setAttribute('aria-label','调整元素宽度');handle.title='拖动调整宽度；方向键微调';el.append(handle);}
      fragment.append(el);
    }
    layer.replaceChildren(fragment);
    if(focusId && !inline){const restored=layer.querySelector(`[data-item-id="${focusId}"]${focusResize?' .map-item-resize':''}`);restored?.focus({preventScroll:true});}
  }
  function render() {
    renderItems();decorate();
    const options=[];
    for (const {node,parents} of entries()) {const option=new Option(`${'　'.repeat(Math.min(parents.length,6))}${node.topic.split('\n')[0].slice(0,80)||'（空主题）'}`,`node:${node.id}`);options.push(option);}
    items.forEach(item=>options.push(new Option(`自由 · ${item.node.topic.slice(0,70)||'图片'}`,`item:${item.node.id}`)));
    $('map-node-select').replaceChildren(...options);controls();inspector();
  }
  function viewportPoint() { const b=mind.el.getBoundingClientRect();return lastPoint || {x:b.left+b.width/2,y:b.top+b.height/2}; }
  function world(point) { const b=mind.map.getBoundingClientRect();return {x:(point.x-b.left)/mind.scaleVal,y:(point.y-b.top)/mind.scaleVal}; }
  function pan(dx,dy) {
    const transform=new DOMMatrix(getComputedStyle(mind.map).transform);mind.map.style.transition='none';
    mind.map.style.transform=`translate3d(${transform.e+dx}px,${transform.f+dy}px,0) scale(${mind.scaleVal})`;mind.bus.fire('move',{dx,dy});return true;
  }
  function zoom(value,point) {
    const b=mind.el.getBoundingClientRect(),anchor=point||{x:b.left+b.width/2,y:b.top+b.height/2},position=world(anchor);
    const transform=new DOMMatrix(getComputedStyle(mind.map).transform),scale=Math.max(.001,Math.min(3,value));
    mind.scaleVal=scale;mind.map.style.transform=`translate3d(${transform.e}px,${transform.f}px,0) scale(${scale})`;
    const after=mind.map.getBoundingClientRect();pan(anchor.x-after.left-position.x*scale,anchor.y-after.top-position.y*scale);mind.bus.fire('scale',scale);
  }
  function center(element) {const a=element.getBoundingClientRect(),b=mind.el.getBoundingClientRect();pan(b.left+b.width/2-a.left-a.width/2,b.top+b.height/2-a.top-a.height/2);}
  function fitContent() {
    const boxes=[mind.nodes.getBoundingClientRect(),...layer.querySelectorAll('.map-free-item')].map(b=>b instanceof Element?b.getBoundingClientRect():b);
    const left=Math.min(...boxes.map(b=>b.left)),right=Math.max(...boxes.map(b=>b.right)),top=Math.min(...boxes.map(b=>b.top)),bottom=Math.max(...boxes.map(b=>b.bottom));
    const b=mind.el.getBoundingClientRect(),factor=Math.min((b.width-60)/Math.max(1,right-left),(b.height-70)/Math.max(1,bottom-top));
    mind.scale(Math.max(.001,Math.min(1,mind.scaleVal*factor)));
    const after=[mind.nodes,...layer.querySelectorAll('.map-free-item')].map(el=>el.getBoundingClientRect());
    pan(b.left+b.width/2-(Math.min(...after.map(x=>x.left))+Math.max(...after.map(x=>x.right)))/2,b.top+b.height/2-(Math.min(...after.map(x=>x.top))+Math.max(...after.map(x=>x.bottom)))/2);
  }
  function locate(value) {
    const [kind,id]=value.split(':');
    if (kind==='node') { const entry=entries().find(item=>item.node.id===id);if(!entry)return;
      entry.parents.forEach(parent=>{const el=mind.findEle(parent);if(el.nodeObj.expanded===false)mind.expandNode(el,true);});
      mind.selectNode(mind.findEle(id));choose('node',id);
    } else choose('item',id);
    if(mind.scaleVal<.85)mind.scale(1);
    const el=elementForSelected(); if(el)center(el);decorate();
  }
  function ensureRoom() {if(entries().length+items.length>=500)throw new Error('最多支持 500 个主题和自由元素。');}
  function insertItem(node,point=viewportPoint(),fixedPosition=null) {
    ensureRoom();const position=fixedPosition||world(point),item={x:position.x,y:position.y,node};
    validate({...doc,data:{...mind.getData(),canvasItems:[...items,item]}}); items.push(item);choose('item',node.id);commit();return node.id;
  }
  function editItem(id) {
    if(!editing || hand)return;const el=layer.querySelector(`[data-item-id="${id}"] .map-free-text`),item=itemById(id);if(!el||!item)return;
    el.hidden=false;el.contentEditable='plaintext-only';inline={element:el,original:item.node.topic,id};el.focus();
    const range=document.createRange();range.selectNodeContents(el);const selected=getSelection();selected.removeAllRanges();selected.addRange(range);
    el.addEventListener('input',()=>{if(el.textContent.length>4000){el.textContent=el.textContent.slice(0,4000);status('文字最多 4000 字符。',true);}});
    el.addEventListener('keydown',event=>{
      event.stopPropagation();if(event.isComposing)return;
      if(event.key==='Escape'){event.preventDefault();el.textContent=inline.original;el.blur();}
      else if(event.key==='Enter' && !event.shiftKey){event.preventDefault();el.blur();$('mindmap-canvas').focus();}
    });
    el.addEventListener('blur',()=>{if(!inline)return;const value=el.innerText;inline=null;item.node.topic=value;el.removeAttribute('contenteditable');commit();},{once:true});
  }
  async function addNode(sibling) {
    if(selection?.kind!=='node')return;ensureRoom();const element=mind.findEle(selection.id),node=element.nodeObj;
    const entry=entries().find(e=>e.node.id===node.id);if(!sibling && entry.parents.length>=40)throw new Error('导图最多支持 40 层。');
    if(sibling&&!node.parent)return;
    const child={id:uid(),topic:'新主题'};if(sibling)await mind.insertSibling('after',element,child);else await mind.addChild(element,child);
    choose('node',child.id);mind.selectNode(mind.findEle(child.id));mind.beginEdit(mind.findEle(child.id));
  }
  async function removeSelected() {
    const node=targetNode();if(!node)return;
    if(selection.kind==='item'){items=items.filter(item=>item.node.id!==node.id);choose(null,null);commit();}
    else if(node.id!==mind.nodeData.id){const parent=node.parent.id;await mind.removeNodes([mind.findEle(node.id)]);choose('node',parent);}
  }
  async function attach(id,parentId) {
    const item=itemById(id);if(!item)return;const parent=entries().find(e=>e.node.id===parentId);
    if(parent.parents.length>=40)throw new Error('导图最多支持 40 层。');
    connecting=null;
    await transaction(async()=>{items=items.filter(value=>value.node.id!==id);await mind.addChild(mind.findEle(parentId),clone(item.node));choose('node',id);mind.selectNode(mind.findEle(id));});
    status('已接入导图',false,true);
  }
  async function detach() {
    if(selection?.kind!=='node')return;const element=mind.findEle(selection.id),node=element.nodeObj;
    if(!node.parent||node.children?.length)throw new Error('请先选择一个末级主题。');
    const clean=validate({format:'paper-mindmap',version:2,data:{nodeData:cloneWithoutParent(node)}}).data.nodeData;
    const b=element.getBoundingClientRect(),point=world({x:b.left+40,y:b.top+50});
    await transaction(async()=>{await mind.removeNodes([element]);items.push({...point,node:clean});choose('item',clean.id);});
  }
  function cloneWithoutParent(node) {return JSON.parse(JSON.stringify(node,(key,value)=>key==='parent'?undefined:value));}
  async function applyProperties(event) {
    event?.preventDefault();const node=targetNode();if(!node)return;
    const props={topic:$('map-node-text').value,hyperLink:$('map-node-link').value.trim(),branchColor:$('map-node-color').value};
    if(node.image){const width=Number($('map-image-width').value);if(width<120||width>720)throw new Error('图片宽度应为 120–720。');props.image={...node.image,width,height:node.image.height*width/node.image.width};}
    validate({format:'paper-mindmap',version:2,data:{nodeData:{...props,id:node.id}}});
    if(selection.kind==='item'){Object.assign(node,props);formDirty=false;commit();}else{await mind.reshapeNode(mind.findEle(node.id),props);formDirty=false;}
  }
  async function readImage(file) {
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('支持 PNG、JPG、WebP 图片。');
    if(file.size>8*1024*1024)throw new Error('单张图片不能超过 8 MB。');
    const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('图片读取失败'));r.readAsDataURL(file);});
    const size=await imageDimensions(url),width=Math.max(120,Math.min(420,size.width,1800*size.width/size.height));
    const image={url,width,height:width*size.height/size.width,fit:'contain'};
    if(image.height<10||image.height>1800)throw new Error('图片比例过长，请裁剪后添加。');return image;
  }
  async function addImage(file,intent={mode:'free',point:viewportPoint()}) {
    intent ||= {mode:'free',point:viewportPoint()};
    if(!file)return;if(imageBusy)throw new Error('正在读取图片，请稍候。');imageBusy=true;
    const revision=documentRevision,position=intent.mode==='free'?world(intent.point):null;
    try {const image=await readImage(file);
      if(revision!==documentRevision)throw new Error('画布已切换，请重新添加图片。');
      if(intent.mode==='free')insertItem({id:uid(),topic:'',image},intent.point,position);
      else {const node=intent.target.kind==='item'?itemById(intent.target.id)?.node:entries().find(e=>e.node.id===intent.target.id)?.node;
        if(!node)throw new Error('目标元素已删除。');
        const candidate=snapshot();const walk=n=>{if(n.id===node.id)n.image=image;n.children?.forEach(walk);};walk(candidate.data.nodeData);candidate.data.canvasItems.forEach(item=>walk(item.node));validate(candidate);
        if(intent.target.kind==='item'){node.image=image;commit();}else await mind.reshapeNode(mind.findEle(node.id),{image});
      }
    }finally{imageBusy=false;}
  }
  function preview(url,caption) {$('map-preview-image').src=url;$('map-preview-image').alt=caption||'图片';$('map-preview-caption').textContent=caption||'';$('map-image-preview').showModal();}
  function clearDrop() {if(dropTarget)dropTarget.removeAttribute('data-drop-target');dropTarget=null;}
  function underNode(x,y) {return document.elementsFromPoint(x,y).find(el=>el.matches('me-tpc'))||null;}
  function cancelGesture() {if(!gesture)return;if(gesture.original){const item=itemById(gesture.id);if(item)Object.assign(item,gesture.original);}gesture=null;clearDrop();renderItems();}
  function pointerDown(event) {
    pointerOrigin={x:event.clientX,y:event.clientY};pointerMoved=false;
    if(gesture && gesture.pointer!==event.pointerId){cancelGesture();event.preventDefault();event.stopPropagation();return;}
    if(inline && inline.element.contains(event.target))return;
    let free=event.target.closest('.map-free-item');const topic=event.target.closest('me-tpc');
    if(inline){const id=free?.dataset.itemId;inline.element.blur();if(id)free=layer.querySelector(`[data-item-id="${id}"]`);}
    if(connecting && topic){event.preventDefault();event.stopPropagation();guard(()=>attach(connecting,topic.nodeObj.id))();return;}
    if(editing && !hand && free && event.button===0){
      if(event.target.closest('a'))return;event.preventDefault();event.stopPropagation();choose('item',free.dataset.itemId);
      const item=itemById(free.dataset.itemId);gesture={kind:event.target.closest('.map-item-resize')?'resize':'item',id:item.node.id,original:clone(item),x:event.clientX,y:event.clientY,pointer:event.pointerId,moved:false};
      free.setPointerCapture(event.pointerId);return;
    }
    if(event.target.matches('me-tpc img'))event.preventDefault();
    if(free && (!editing||hand))event.preventDefault();
    const blank=!event.target.closest('me-tpc,me-epd,.map-free-item,a,#input-box');
    if(blank && event.pointerType==='mouse' && event.button===0){event.preventDefault();event.stopPropagation();choose(null,null);gesture={kind:'pan',x:event.clientX,y:event.clientY,pointer:event.pointerId,moved:false};mind.el.setPointerCapture(event.pointerId);mind.el.focus({preventScroll:true});}
  }
  function pointerMove(event) {
    if(pointerOrigin && Math.hypot(event.clientX-pointerOrigin.x,event.clientY-pointerOrigin.y)>6)pointerMoved=true;
    lastPoint={x:event.clientX,y:event.clientY};if(!gesture||gesture.pointer!==event.pointerId)return;
    event.stopPropagation();event.preventDefault();
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(Math.hypot(dx,dy)>5)gesture.moved=true;
    if(gesture.kind==='pan'){pan(dx,dy);gesture.x=event.clientX;gesture.y=event.clientY;return;}
    const item=itemById(gesture.id),el=layer.querySelector(`[data-item-id="${gesture.id}"]`);if(!item||!el)return;
    if(gesture.kind==='item'){
      item.x=Math.max(-100000,Math.min(100000,gesture.original.x+dx/mind.scaleVal));item.y=Math.max(-100000,Math.min(100000,gesture.original.y+dy/mind.scaleVal));el.style.left=`${item.x}px`;el.style.top=`${item.y}px`;el.dataset.dragging=String(gesture.moved);
      clearDrop();if(gesture.moved){dropTarget=underNode(event.clientX,event.clientY);dropTarget?.setAttribute('data-drop-target','true');}
    }else{
      const original=gesture.original.node,width=Math.max(120,Math.min(720,(original.image?.width||parseInt(original.style?.width)||260)+dx/mind.scaleVal));
      if(item.node.image){const height=original.image.height*width/original.image.width;if(height<=1800){item.node.image={...item.node.image,width,height};const img=el.querySelector('img');img.style.width=`${width}px`;img.style.height=`${height}px`;}}
      else{item.node.style={...item.node.style,width:`${Math.round(width)}px`};el.querySelector('.map-free-text').style.width=item.node.style.width;}
    }
  }
  function pointerUp(event) {
    if(!gesture||gesture.pointer!==event.pointerId)return;event.stopPropagation();const current=gesture;gesture=null;const target=dropTarget;clearDrop();
    if(current.kind==='pan')return;
    if(current.kind==='item' && current.moved && target){guard(()=>attach(current.id,target.nodeObj.id))();}
    else if(current.moved)commit();
  }
  function wireCanvas() {
    mind.el.addEventListener('pointerdown',pointerDown,true);mind.el.addEventListener('pointermove',pointerMove,true);mind.el.addEventListener('pointerup',pointerUp,true);
    mind.el.addEventListener('pointercancel',cancelGesture,true);
    mind.el.addEventListener('dblclick',event=>{
      if(!editing||hand)return;const free=event.target.closest('.map-free-item');
      if(free){if(event.target.matches('img'))preview(itemById(free.dataset.itemId).node.image.url,itemById(free.dataset.itemId).node.topic);else editItem(free.dataset.itemId);}
      else if(!event.target.closest('me-tpc,me-epd,a,#input-box')){const id=insertItem({id:uid(),topic:'文字'}, {x:event.clientX,y:event.clientY});editItem(id);}
    });
    mind.el.addEventListener('click',event=>{
      const free=event.target.closest('.map-free-item');
      if(free){if(!editing && event.target.matches('img') && !pointerMoved)preview(itemById(free.dataset.itemId).node.image.url,itemById(free.dataset.itemId).node.topic);return;}
      if(event.target.matches('me-tpc img') && !pointerMoved){const el=event.target.closest('me-tpc');choose('node',el.nodeObj.id);preview(el.nodeObj.image.url,el.nodeObj.topic);}
    });
    layer.addEventListener('focusin',event=>{const free=event.target.closest('.map-free-item');if(free)choose('item',free.dataset.itemId);});
    mind.el.addEventListener('dragover',event=>{if([...event.dataTransfer.types].some(type=>['Files','text/plain'].includes(type)))event.preventDefault();});
    mind.el.addEventListener('drop',guard(async event=>{
      const files=[...event.dataTransfer.files],text=event.dataTransfer.getData('text/plain');
      if(!files.length&&!(editing&&text))return;
      event.preventDefault();event.stopPropagation();
      if(files.length){
        if(!editing){await openFile(files[0]);return;}
        for(let i=0;i<files.length;i++)await addImage(files[i],{mode:'free',point:{x:event.clientX+i*24,y:event.clientY+i*24}});
      }else insertItem({id:uid(),topic:text.slice(0,4000)},{x:event.clientX,y:event.clientY});
    }));
    if(editing){
      document.addEventListener('paste',guard(async event=>{
        if(textInput(event.target)||document.querySelector('dialog[open]'))return;
        const files=[...(event.clipboardData?.files||[])];
        if(files.length){event.preventDefault();for(let i=0;i<files.length;i++)await addImage(files[i],{mode:'free',point:viewportPoint()});return;}
        const own=event.clipboardData?.getData('application/x-paper-element');
        if(own){event.preventDefault();const node=JSON.parse(own);node.id=uid();const clean=validate({format:'paper-mindmap',version:2,data:{nodeData:node}}).data.nodeData;delete clean.children;insertItem(clean);return;}
        const text=event.clipboardData?.getData('text/plain');if(text){event.preventDefault();insertItem({id:uid(),topic:text.slice(0,4000)});if(text.length>4000)status('已保留前 4000 字符。',true);}
      }));
      document.addEventListener('copy',event=>{if(textInput(event.target)||!targetNode())return;const node=cloneWithoutParent(targetNode());delete node.children;event.clipboardData.setData('text/plain',node.topic);event.clipboardData.setData('application/x-paper-element',JSON.stringify(node));event.preventDefault();});
    }
  }
  function toggleHand(value) {hand=value;mind.editable=editing&&!hand;$('map-hand-tool').setAttribute('aria-pressed',String(value));$('map-select-tool').setAttribute('aria-pressed',String(!value));connecting=null;controls();}
  function closeMenu(menu) {
    if(!menu.open)return;
    clearTimeout(menuTimers.get(menu));menu.classList.remove('is-open');
    menu.querySelector('summary')?.setAttribute('aria-expanded','false');
    const timer=setTimeout(()=>{if(!menu.classList.contains('is-open'))menu.open=false;menuTimers.delete(menu);},menuDelay());
    menuTimers.set(menu,timer);
  }
  function closeMenus(except) {document.querySelectorAll('.map-menu').forEach(menu=>{if(menu!==except)closeMenu(menu);});}
  function toggleMenu(menu) {
    if(menu.classList.contains('is-open')){closeMenu(menu);return;}
    closeMenus(menu);clearTimeout(menuTimers.get(menu));menu.open=true;
    menu.querySelector('summary')?.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>{if(menu.open)menu.classList.add('is-open');});
  }
  function wire() {
    $('map-version').textContent=editing?'本机草稿':'只读';
    $('map-add-child').onclick=guard(()=>addNode(false));$('map-add-sibling').onclick=guard(()=>addNode(true));$('map-delete').onclick=guard(removeSelected);
    $('map-undo').onclick=()=>undo();$('map-redo').onclick=()=>undo(true);$('map-detach').onclick=guard(detach);
    $('map-connect').onclick=()=>{connecting=selection?.kind==='item'?selection.id:null;controls();if(connecting)status('点击一个主题接入 · Esc 取消',false,true);};
    $('map-free-text').onclick=guard(()=>{const id=insertItem({id:uid(),topic:'文字'});editItem(id);});
    $('map-free-image').onclick=()=>{imageIntent={mode:'free',point:viewportPoint()};$('map-image-file').click();};
    $('map-add-image').onclick=()=>{if(!selection)return;imageIntent={mode:'attach',target:{...selection}};$('map-image-file').click();};
    $('map-image-file').onchange=guard(async event=>{const file=event.target.files[0];event.target.value='';await addImage(file,imageIntent);});
    $('map-node-form').onsubmit=guard(applyProperties);$('map-node-form').addEventListener('input',()=>{formDirty=true;});$('map-node-form').addEventListener('change',guard(applyProperties));
    $('map-remove-image').onclick=guard(async()=>{const node=targetNode();if(!node)return;if(selection.kind==='item'){delete node.image;commit();}else await mind.reshapeNode(mind.findEle(node.id),{image:null});});
    $('map-inspector-toggle').onclick=()=>{panel('map-inspector',$('map-inspector').hidden);inspector();};$('map-inspector-close').onclick=()=>panel('map-inspector',false);
    $('map-find-toggle').onclick=()=>{panel('map-navigation',$('map-navigation').hidden);if(!$('map-navigation').hidden)$('map-node-select').focus();};$('map-navigation-close').onclick=()=>{panel('map-navigation',false);$('map-find-toggle').focus();};$('map-node-select').onchange=guard(event=>locate(event.target.value));
    $('map-hand-tool').onclick=()=>toggleHand(!hand);$('map-select-tool').onclick=()=>toggleHand(false);
    $('map-zoom-out').onclick=()=>mind.scale(mind.scaleVal/1.2);$('map-zoom-in').onclick=()=>mind.scale(mind.scaleVal*1.2);$('map-fit').onclick=fitContent;
    $('map-center').onclick=()=>{fitContent();center(mind.findEle(mind.nodeData.id));};
    $('map-fullscreen').onclick=guard(async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();});
    $('map-open').onclick=()=>$('map-import-file').click();$('map-open-menu').onclick=()=>$('map-import-file').click();
    $('map-import-file').onchange=guard(async event=>{
      const file=event.target.files[0];event.target.value='';await openFile(file);
    });
    $('map-reset').onclick=guard(async()=>{
      if(editing){if(await confirmReplacement('用公开版替换本机草稿？')){load(publishedMindmap);commit();}}
      else{load(publishedMindmap);$('map-version').textContent='只读';status('已恢复公开版',false,true);}
    });
    $('map-export').onclick=guard(()=>{
      if(formDirty)throw new Error('请先应用属性修改。');if(inline)inline.element.blur();
      $('input-box')?.blur();
      const value=snapshot(),url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'})),link=document.createElement('a');
      link.href=url;link.download='library.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);exportedGeneration=generation;status('已导出，包含图片与自由元素',false,true);
    });
    $('map-help-button').onclick=()=>$('map-help').showModal();$('map-help-close').onclick=()=>$('map-help').close();
    $('map-confirm-cancel').onclick=()=>$('map-confirm').close('cancel');$('map-confirm-yes').onclick=()=>$('map-confirm').close('yes');
    $('map-preview-close').onclick=()=>$('map-image-preview').close();$('map-image-preview').addEventListener('close',()=>$('map-preview-image').removeAttribute('src'));
    document.querySelectorAll('.map-menu > summary').forEach(summary=>{
      summary.setAttribute('aria-expanded','false');
      summary.addEventListener('click',event=>{event.preventDefault();toggleMenu(summary.parentElement);});
    });
    document.addEventListener('click',event=>{if(event.target.closest('.map-menu-panel button')||!event.target.closest('.map-menu'))closeMenus();});
    document.addEventListener('pointerdown',event=>{if(formDirty && !event.target.closest('#map-node-form'))guard(applyProperties)();},true);
    document.addEventListener('keydown',event=>{
      if(textInput(event.target)||document.querySelector('dialog[open]'))return;
      if(event.key==='Escape'){connecting=null;controls();cancelGesture();closeMenus();panel('map-inspector',false);panel('map-navigation',false);$('map-status').dataset.visible='false';return;}
      const canvas=mind.el.contains(event.target),modified=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
      let action;
      if(modified&&key==='o')action=()=>$('map-import-file').click();
      else if(editing&&modified&&['z','y'].includes(key))action=()=>undo(key==='y'||event.shiftKey);
      else if(canvas&&event.target.matches('me-epd')&&['Enter',' '].includes(event.key))action=()=>mind.expandNode(event.target.previousElementSibling);
      else if(canvas&&selection?.kind==='item'&&['Enter',' '].includes(event.key))action=()=>{const n=targetNode();if(!editing&&n.image)preview(n.image.url,n.topic);else editItem(n.id);};
      else if(canvas&&event.target.matches('me-tpc img')&&['Enter',' '].includes(event.key))action=()=>preview(targetNode().image.url,targetNode().topic);
      else if(editing&&canvas&&!hand){
        if(key==='f2')action=()=>{if(selection?.kind==='item')editItem(selection.id);else if(selection)mind.beginEdit(mind.findEle(selection.id));};
        else if(key==='enter')action=()=>addNode(!modified);
        else if(['delete','backspace'].includes(key))action=removeSelected;
        else if(event.target.matches('.map-item-resize')&&['ArrowLeft','ArrowRight'].includes(event.key))action=()=>{const item=itemById(selection.id),delta=event.key==='ArrowRight'?20:-20;if(item.node.image){const image=item.node.image,width=Math.max(120,Math.min(720,image.width+delta)),height=image.height*width/image.width;if(height<=1800)item.node.image={...image,width,height};}else item.node.style={...item.node.style,width:`${Math.max(120,Math.min(720,(parseInt(item.node.style?.width)||260)+delta))}px`};commit();};
      }
      if(action){event.preventDefault();event.stopPropagation();guard(action)();}
    },true);
    window.addEventListener('beforeunload',event=>{if(editing&&(generation>Math.max(savedGeneration,exportedGeneration)||formDirty||inline||$('input-box'))){event.preventDefault();event.returnValue='';}});
    new MutationObserver(()=>{mind.changeTheme(theme());decorate();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-bs-theme']});
    let resizeTimer=null;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(ready)fitContent();},160);});
    new ResizeObserver(()=>mind.linkDiv()).observe(mind.el);wireCanvas();
  }
  async function init() {
    if(!ME||!validate||typeof publishedMindmap==='undefined')throw new Error('画布文件未能加载，请保留完整文件后刷新。');
    doc=validate(publishedMindmap);let warning='';
    if(editing){try{db=await openDatabase();const draft=await draftRequest('readonly');if(draft)doc=validate(draft);}catch(_){warning='本机草稿不可用，请导出文件保存修改。';}}
    items=clone(doc.data.canvasItems);
    mind=new ME({el:'#mindmap-canvas',direction:ME.RIGHT,editable:editing,contextMenu:false,toolBar:false,keypress:false,allowUndo:false,overflowHidden:false,newTopicName:'新主题',theme:theme(),alignment:'nodes',scaleMin:.15,scaleMax:3});
    mind.init(clone(doc.data));mind.move=pan;
    const original=mind.map.getBoundingClientRect();mind.map.style.transformOrigin='0 0';const adjusted=mind.map.getBoundingClientRect();pan(original.left-adjusted.left,original.top-adjusted.top);mind.scale=zoom;
    layer=document.createElement('div');layer.className='map-free-layer';mind.map.append(layer);
    mind.bus.addListener('operation',operation=>{
      if(operation.name==='beginEdit'){
        const input=$('input-box');input?.addEventListener('input',()=>{if(input.textContent.length>4000){input.textContent=input.textContent.slice(0,4000);status('文字最多 4000 字符。',true);}});return;
      }
      commit();
    });
    mind.bus.addListener('selectNodes',nodes=>{if(nodes.length)choose('node',nodes[0].id);});
    mind.bus.addListener('selectNewNode',node=>choose('node',node.id));mind.bus.addListener('expandNode',()=>{if(editing)commit();else decorate();});
    mind.bus.addListener('scale',value=>{$('map-scale').textContent=`${value<.01?(value*100).toFixed(1):Math.round(value*100)}%`;});
    $('map-title').textContent=doc.title;$('map-title').title=doc.title;wire();ready=true;
    history=[JSON.stringify(snapshot())];historyIndex=0;render();requestAnimationFrame(()=>fitContent());
    saveState(warning?'未保存':'');status(warning||'画布已就绪',!!warning);
  }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('paper-mindmaps', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('drafts');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('浏览器阻止了草稿存储。'));
    });
  }
  function draftRequest(mode, value) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', mode);
      const store = transaction.objectStore('drafts');
      const request = mode === 'readonly' ? store.get('library') : store.put(value, 'library');
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('草稿保存中断。'));
    });
  }
  function theme() {
    const dark = document.documentElement.dataset.bsTheme === 'dark';
    const base = dark ? ME.DARK_THEME : ME.THEME;
    return {...base, name: 'Paper library', type: dark ? 'dark' : 'light',
      palette: ['#8250b6', '#bc6e16', '#0969da', '#278267', '#68758c'],
      cssVar: {...base.cssVar, '--bgcolor': dark ? '#0d1117' : '#ffffff',
        '--color': dark ? '#e6edf3' : '#1f2328',
        '--main-bgcolor': dark ? '#151b23' : '#f6f8fa', '--main-color': dark ? '#e6edf3' : '#1f2328',
        '--root-bgcolor': dark ? '#212830' : '#eaeef2', '--root-color': dark ? '#e6edf3' : '#1f2328'}};
  }
  function confirmReplacement(message) {
    return new Promise(resolve => {
      const dialog = $('map-confirm');
      $('map-confirm-message').textContent = message;
      dialog.returnValue = '';
      dialog.addEventListener('close', () => resolve(dialog.returnValue === 'yes'), {once: true});
      dialog.showModal();
      $('map-confirm-cancel').focus();
    });
  }
  function imageDimensions(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({width: image.naturalWidth, height: image.naturalHeight});
      image.onerror = () => reject(new Error('无法读取此图片，请选择有效的 PNG、JPG 或 WebP 文件。'));
      image.src = url;
    });
  }

  init().catch(report);
})();
