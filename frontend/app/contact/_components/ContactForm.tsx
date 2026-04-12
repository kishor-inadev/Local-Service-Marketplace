'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const contactSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	subject: z.string().min(5, 'Subject must be at least 5 characters'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<ContactFormData>({
		resolver: zodResolver(contactSchema),
	});

	const onSubmit = async (data: ContactFormData) => {
		setIsSubmitting(true);
		try {
			await apiClient.post('/admin/contact', data);
			toast.success("Message sent successfully! We'll get back to you soon.");
			reset();
		} catch (error) {
			console.error('Contact form error:', error);
			toast.error('Failed to send message. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div>
			<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				Send us a Message
			</h2>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Name
					</label>
					<Input
						id="name"
						type="text"
						{...register('name')}
						error={errors.name?.message}
						placeholder="Your name"
					/>
				</div>

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Email
					</label>
					<Input
						id="email"
						type="email"
						{...register('email')}
						error={errors.email?.message}
						placeholder="your@email.com"
					/>
				</div>

				<div>
					<label
						htmlFor="subject"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Subject
					</label>
					<Input
						id="subject"
						type="text"
						{...register('subject')}
						error={errors.subject?.message}
						placeholder="How can we help?"
					/>
				</div>

				<div>
					<label
						htmlFor="message"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
					>
						Message
					</label>
					<textarea
						id="message"
						{...register('message')}
						rows={6}
						className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
						placeholder="Tell us more about your inquiry..."
					/>
					{errors.message && (
						<p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
					)}
				</div>

				<Button type="submit" disabled={isSubmitting} className="w-full">
					{isSubmitting ? (
						'Sending...'
					) : (
						<>
							<Send className="w-4 h-4 mr-2" />
							Send Message
						</>
					)}
				</Button>
			</form>
		</div>
	);
}
