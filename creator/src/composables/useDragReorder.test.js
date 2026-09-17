/** @format */

import { describe, expect, it, vi } from "vitest";
import { useDragReorder } from "./useDragReorder";

function dragEvent(clientY = 10) {
    return {
        clientY,
        currentTarget: {
            contains: () => false,
            getBoundingClientRect: () => ({ top: 0, height: 20 }),
        },
        preventDefault: vi.fn(),
        dataTransfer: {
            effectAllowed: "",
            dropEffect: "",
            setData: vi.fn(),
        },
    };
}

describe("useDragReorder", () => {
    it("resolves before and after drops to final insertion indexes", () => {
        const onMove = vi.fn();
        const reorder = useDragReorder(onMove);

        reorder.startDrag(0, dragEvent());
        reorder.handleDrop(2, dragEvent(1));
        expect(onMove).toHaveBeenLastCalledWith(0, 1);

        reorder.startDrag(2, dragEvent());
        reorder.handleDrop(0, dragEvent(19));
        expect(onMove).toHaveBeenLastCalledWith(2, 1);
    });

    it("does not move when a drop resolves to the source position", () => {
        const onMove = vi.fn();
        const reorder = useDragReorder(onMove);

        reorder.startDrag(1, dragEvent());
        reorder.handleDrop(1, dragEvent(1));

        expect(onMove).not.toHaveBeenCalled();
    });

    it("clears drag state when leaving a drop target", () => {
        const reorder = useDragReorder(vi.fn());

        reorder.startDrag(0, dragEvent());
        reorder.handleDragOver(1, dragEvent(1));
        expect(reorder.overIndex.value).toBe(1);

        reorder.handleDragLeave({
            currentTarget: { contains: () => false },
            relatedTarget: null,
        });

        expect(reorder.overIndex.value).toBeNull();
        expect(reorder.overBefore.value).toBe(false);
    });
});
