// F6.3: Multi-step student form state managed via Context API
import { createContext, useContext, useState, useCallback } from 'react';

const STEPS = ['Basic Info', 'Contact & School', 'University Goal'];
const DRAFT_KEY = 'student_form_draft';

const defaultData = {
  firstName: '', lastName: '',
  email: '', phone: '', grade: '', school: '',
  university: [],
};

const StudentFormContext = createContext(null);

export function useStudentForm() {
  const ctx = useContext(StudentFormContext);
  if (!ctx) throw new Error('useStudentForm must be used inside StudentFormProvider');
  return ctx;
}

export function StudentFormProvider({ children }) {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || defaultData; }
    catch { return defaultData; }
  })();

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(saved);

  const updateFormData = useCallback((partial) => {
    setFormData(prev => {
      const next = { ...prev, ...partial };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const nextStep = useCallback(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), []);
  const prevStep = useCallback(() => setStep(s => Math.max(s - 1, 0)), []);

  const resetForm = useCallback(() => {
    setStep(0);
    setFormData(defaultData);
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return (
    <StudentFormContext.Provider value={{ step, setStep, formData, updateFormData, nextStep, prevStep, resetForm, STEPS }}>
      {children}
    </StudentFormContext.Provider>
  );
}

export default StudentFormContext;
