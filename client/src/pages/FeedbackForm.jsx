// F6.1: Feedback form — React Hook Form + Zod + Thai/English regex
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { HiChatAlt2, HiCheck } from 'react-icons/hi';

// F6.1: Validation schema with Regex supporting Thai and English
const feedbackSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\u0E00-\u0E7F\s]+$/, 'Name must contain letters only (Thai or English)'),
  email: z.string().email('Valid email is required'),
  subject: z.enum(['Teaching Clarity', 'Problem Solving', 'Lab Work', 'Exam Preparation', 'Overall'], {
    errorMap: () => ({ message: 'Please select a subject' }),
  }),
  rating: z.coerce.number().min(1, 'Min rating is 1').max(5, 'Max rating is 5'),
  // F6.1: message 20–500 chars
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(500, 'Message must be at most 500 characters'),
  isAnonymous: z.boolean().optional(),
});

export default function FeedbackForm() {
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { isAnonymous: false, rating: '' },
  });

  const messageVal = watch('message') || '';
  const isAnonymous = watch('isAnonymous');

  const onSubmit = async (data) => {
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    console.log('Feedback submitted:', data);
    toast.success('Thank you for your feedback!');
    setSubmitted(true);
    reset();
  };

  if (submitted) return (
    <div className="glass-card p-12 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
        <HiCheck className="text-green-400 text-3xl" />
      </div>
      <h3 className="text-xl font-bold">Feedback Submitted!</h3>
      <p className="text-[var(--text-secondary)]">Thank you for helping us improve.</p>
      <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Submit Another</button>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HiChatAlt2 className="text-[var(--primary)]" /> Feedback
          </h2>
          <p className="subtitle">Share your thoughts in Thai or English</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

          {/* F6.1: Name — Thai/English regex */}
          <div className="form-group">
            <label className="form-label">Full Name <span className="text-red-400">*</span></label>
            <input {...register('name')} className="form-control" placeholder="ชื่อ-นามสกุล or Full Name" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* F6.1: Email */}
          <div className="form-group">
            <label className="form-label">Email <span className="text-red-400">*</span></label>
            <input {...register('email')} type="email" className="form-control" placeholder="your@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Topic <span className="text-red-400">*</span></label>
              <select {...register('subject')} className="form-control">
                <option value="">Select...</option>
                <option>Teaching Clarity</option>
                <option>Problem Solving</option>
                <option>Lab Work</option>
                <option>Exam Preparation</option>
                <option>Overall</option>
              </select>
              {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject.message}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Rating (1–5) <span className="text-red-400">*</span></label>
              <input {...register('rating')} type="number" min="1" max="5" className="form-control" placeholder="1–5" />
              {errors.rating && <p className="text-red-400 text-xs mt-1">{errors.rating.message}</p>}
            </div>
          </div>

          {/* F6.1: Message 20–500 chars */}
          <div className="form-group">
            <label className="form-label flex justify-between">
              <span>Message <span className="text-red-400">*</span></span>
              <span className={`text-xs ${messageVal.length < 20 ? 'text-red-400' : messageVal.length > 500 ? 'text-red-400' : 'text-[var(--text-tertiary)]'}`}>
                {messageVal.length}/500
              </span>
            </label>
            <textarea
              {...register('message')}
              className="form-control"
              rows={4}
              placeholder="Share your feedback (min 20 characters)..."
            />
            {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input {...register('isAnonymous')} type="checkbox" id="anon" className="w-4 h-4 rounded accent-[var(--accent-color)]" />
            <label htmlFor="anon" className="text-sm">Submit anonymously</label>
          </div>
          {isAnonymous && (
            <p className="text-xs text-[var(--text-tertiary)] -mt-2">Your name and email will not be stored.</p>
          )}

          {/* F6.1: Disabled button during loading */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
}
