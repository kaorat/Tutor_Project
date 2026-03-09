// F2.3: Zustand cart store — Select students, then pick a class to enroll them into
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],           // students: [{ _id, firstName, lastName, grade }]
      selectedClass: null,  // { _id, name, subject, level }
      isDrawerOpen: false,

      // Add student to cart (no duplicate — F2.3 C02)
      addItem: (student) => {
        const items = get().items;
        if (items.some(s => s._id === student._id)) return;
        set({ items: [...items, student] });
      },

      // Add multiple students at once
      addMultiple: (students) => {
        const existing = get().items;
        const ids = new Set(existing.map(s => s._id));
        const newOnes = students.filter(s => !ids.has(s._id));
        if (newOnes.length > 0) set({ items: [...existing, ...newOnes] });
      },

      removeItem: (id) => {
        set({ items: get().items.filter(s => s._id !== id) });
      },

      clearCart: () => set({ items: [], selectedClass: null }),

      setSelectedClass: (cls) => set({ selectedClass: cls }),

      toggleDrawer: () => set({ isDrawerOpen: !get().isDrawerOpen }),

      // Derived: number of students in cart
      getItemCount: () => get().items.length,
    }),
    {
      name: 'cart-storage',
    }
  )
);

export default useCartStore;
