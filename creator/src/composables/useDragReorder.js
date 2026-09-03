/** @format */

import { ref } from "vue";

/**
 * Shared HTML5 drag-and-drop reordering state and handlers.
 *
 * `onMove(fromIndex, toIndex)` receives the reorder request where `toIndex`
 * is the final insertion index after the source item has been removed. This
 * matches the store's `moveXTo(from, to)` methods, which splice out the source
 * before re-inserting at the target position.
 *
 * The existing "Move Up" / "Move Down" buttons remain the keyboard and
 * assistive-technology alternative, satisfying WCAG 2.5.7 (Dragging Movements).
 */
export function useDragReorder(onMove) {
    const draggingIndex = ref(null);
    const overIndex = ref(null);
    const overBefore = ref(false);

    function startDrag(index, event) {
        draggingIndex.value = index;
        overIndex.value = null;
        overBefore.value = false;

        if (event?.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            try {
                event.dataTransfer.setData("text/plain", String(index));
            } catch {
                // Some browsers disallow setData outside a drag gesture.
            }
        }
    }

    function isBefore(index, event) {
        const rect = event?.currentTarget?.getBoundingClientRect();
        if (!rect) {
            return false;
        }

        return event.clientY < rect.top + rect.height / 2;
    }

    function handleDragOver(index, event) {
        if (draggingIndex.value == null || index == null) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
        }

        overIndex.value = index;
        overBefore.value = isBefore(index, event);
    }

    function handleDragLeave(event) {
        const related = event?.relatedTarget;
        const current = event?.currentTarget;
        if (
            related &&
            current?.contains?.(related)
        ) {
            return;
        }

        overIndex.value = null;
        overBefore.value = false;
    }

    function resolveTargetIndex(fromIndex, index, before) {
        let insertPos = before ? index : index + 1;
        if (fromIndex < insertPos) {
            insertPos -= 1;
        }

        return insertPos;
    }

    function handleDrop(index, event) {
        const fromIndex = draggingIndex.value;
        if (fromIndex == null || index == null) {
            endDrag();
            return;
        }

        event.preventDefault();
        const before = isBefore(index, event);
        const targetIndex = resolveTargetIndex(fromIndex, index, before);

        endDrag();

        if (targetIndex === fromIndex) {
            return;
        }

        onMove(fromIndex, targetIndex);
    }

    function endDrag() {
        draggingIndex.value = null;
        overIndex.value = null;
        overBefore.value = false;
    }

    return {
        draggingIndex,
        overIndex,
        overBefore,
        startDrag,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        endDrag,
    };
}
