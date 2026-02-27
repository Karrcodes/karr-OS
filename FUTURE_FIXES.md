# KarrOS Future Fixes & Backlog

This file tracks identified bugs, UX improvements, and feature refinements to be addressed in future sessions.

---

## 🟢 Operations Matrix

### **Refinement: Tier 3 (Minimal) Labeling State**
**Identified**: 2026-02-26
**Description**: The "Tier 3" (minimal) labeling state in the Operations Matrix is triggered when task density exceeds a certain threshold (e.g., 7+ tasks per day in a single quadrant). Currently, the UI does not handle this high-density state gracefully, leading to overlapping elements or illegible labels.
**Objective**: Refine the `finalPositions` memo and `TaskDot` component in `TasksMatrix.tsx` to:
1.  **Improve Repulsion**: Enhance vertical repulsion logic for tightly packed items to prevent overlap.
2.  **Optimize Visuals**: Refine the "minimal" dot representation to remain distinct and interactive even without title text.
3.  **Smooth Transitions**: Ensure seamless scaling between Tier 1 (Full), Tier 2 (Compact), and Tier 3 (Minimal) as density changes.

### **Bug Fix: Jittery Drag-and-Drop Placement**
**Identified**: 2026-02-26
**Description**: Items sometimes exhibit jittery or erratic behavior when being dragged and placed in a new location in the Operations Matrix. While the final placement is eventually correct, the visual transition during the move needs to be smoother.
**Objective**: 
1.  **Motion Smoothing**: Refine the Framer Motion configuration to provide a more stable visual experience during the active drag phase.
2.  **Physics Refinement**: Adjust the repulsion forces to be less aggressive while an item is being moved to prevent surrounding items from jumping significantly.
