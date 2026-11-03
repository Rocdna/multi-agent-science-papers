"""Publication format regression checks; run with unittest (no extra packages)."""
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import build_mindmap as builder


def document(version=2):
    return {
        "format": "paper-mindmap", "version": version, "title": "Test",
        "data": {"nodeData": {"id": "root", "topic": "Root"}},
    }


class MindmapPublicationTests(unittest.TestCase):
    def test_old_published_documents_remain_accepted(self):
        self.assertEqual(builder.validate(document(1)), 1)

    def test_identifiers_are_shared_across_tree_and_free_canvas(self):
        value = document()
        value["data"]["canvasItems"] = [{"x": 10, "y": -20, "node": {"id": "root", "topic": "Free"}}]
        with self.assertRaises(ValueError):
            builder.validate(value)

    def test_node_limit_counts_both_tree_and_free_elements(self):
        value = document()
        value["data"]["nodeData"]["children"] = [{"id": f"n-{i}", "topic": "Topic"} for i in range(499)]
        self.assertEqual(builder.validate(value), 500)
        value["data"]["canvasItems"] = [{"x": 0, "y": 0, "node": {"id": "free", "topic": "One too many"}}]
        with self.assertRaises(ValueError):
            builder.validate(value)

    def test_free_element_cannot_silently_hide_a_subtree(self):
        value = document()
        value["data"]["canvasItems"] = [{"x": 0, "y": 0, "node": {"id": "free", "topic": "Free", "children": [{"id": "child", "topic": "Child"}]}}]
        with self.assertRaises(ValueError):
            builder.validate(value)

    def test_invalid_links_or_nonfinite_positions_do_not_publish(self):
        for change in ("link", "position"):
            with self.subTest(change=change):
                value = document()
                if change == "link":
                    value["data"]["nodeData"]["hyperLink"] = "javascript:alert(1)"
                else:
                    value["data"]["canvasItems"] = [{"x": float("nan"), "y": 0, "node": {"id": "free", "topic": "Free"}}]
                with self.assertRaises(ValueError):
                    builder.validate(value)

    def test_bundle_preserves_images_positions_and_plain_text(self):
        value = document()
        value["data"]["canvasItems"] = [{
            "x": -123.5, "y": 456.25,
            "node": {"id": "image", "topic": "<script>plain text</script>",
                     "image": {"url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNSkAAAAASUVORK5CYII=", "width": 360, "height": 200}},
        }]
        with tempfile.TemporaryDirectory(prefix="paper-mindmap-test-") as directory:
            source, target = Path(directory) / "library.json", Path(directory) / "bundle.js"
            source.write_text(json.dumps(value), encoding="utf-8")
            with patch.multiple(builder, SOURCE=source, TARGET=target, ROOT=Path(directory)):
                with contextlib.redirect_stdout(io.StringIO()):
                    builder.main()
            bundle = target.read_text(encoding="utf-8")
            self.assertNotIn("<script>", bundle)
            decoded = json.loads(bundle.split("const publishedMindmap=", 1)[1].removesuffix(";\n"))
            self.assertEqual(decoded, value)


if __name__ == "__main__":
    unittest.main()
