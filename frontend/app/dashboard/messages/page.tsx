'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { isMessagingEnabled } from '@/config/features';
import { ROUTES } from '@/config/constants';
import { Layout } from '@/components/layout/Layout';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { SkeletonListItem } from '@/components/ui/Skeleton';
import { ErrorState } from "@/components/ui/ErrorState";
import { messageService, Conversation } from "@/services/message-service";
import { formatDateTime, cn } from '@/utils/helpers';
import { Send, ArrowLeft } from 'lucide-react';

export default function MessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Redirect if not authenticated or messaging is disabled
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(ROUTES.LOGIN);
    } else if (!authLoading && isAuthenticated && !isMessagingEnabled()) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, authLoading, router]);

  const {
		data: conversations,
		isLoading,
		error: conversationsError,
		refetch,
	} = useQuery({
		queryKey: ["conversations"],
		queryFn: () => messageService.getConversations(),
		enabled: isMessagingEnabled() && isAuthenticated,
	});

  const { data: messages } = useQuery({
		queryKey: ["messages", selectedJobId],
		queryFn: () => messageService.getMessagesByJob(selectedJobId!),
		enabled: !!selectedJobId && isMessagingEnabled() && isAuthenticated,
	});

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedJobId) return;

    try {
      await messageService.sendMessage({ job_id: selectedJobId, message: messageText });
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedJobId] });
    } catch (error) {
      console.error('Failed to send message');
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
		<Layout>
			<div className='container-custom py-8'>
				<h1 className='text-3xl font-bold text-gray-900 mb-8'>Messages</h1>

				{conversationsError ?
					<ErrorState
						title='Failed to load messages'
						message="We couldn't load your conversations. Please try again."
						retry={() => refetch()}
					/>
				:	<div className='grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]'>
						{/* Conversations List */}
						<Card className={cn(showThread ? 'hidden md:flex md:flex-col' : '')}>
							<CardHeader>
								<h2 className='font-semibold text-gray-900'>Conversations</h2>
							</CardHeader>
							<CardContent>
								{isLoading ?
									<div className='space-y-2'>{Array.from({ length: 4 }).map((_, i) => <SkeletonListItem key={i} />)}</div>
								: conversations && conversations.length > 0 ?
									<div className='space-y-2'>
										{conversations.map((conv: Conversation) => (
											<button
												key={conv.job_id}
												onClick={() => { setSelectedJobId(conv.job_id); setShowThread(true); }}
												className={`w-full text-left p-3 rounded-md transition-colors ${
													selectedJobId === conv.job_id ? "bg-primary-50 border-primary-200" : "hover:bg-gray-50"
												}`}>
												<p className='font-medium text-gray-900'>Job #{conv.job_id.slice(0, 8)}</p>
												<p className='text-sm text-gray-600 truncate'>{conv.last_message}</p>
											</button>
										))}
									</div>
								:	<p className='text-center text-gray-500 py-8'>No conversations</p>}
							</CardContent>
						</Card>

						{/* Messages */}
						<div className={cn('md:col-span-2', !showThread ? 'hidden md:block' : '')}>
							<Card className='h-full flex flex-col'>
								<CardHeader>
									<button
										onClick={() => setShowThread(false)}
										className='md:hidden mb-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
									>
										<ArrowLeft className='h-4 w-4' /> Back to conversations
									</button>
									<h2 className='font-semibold text-gray-900 dark:text-white'>
										{selectedJobId ? `Job #${selectedJobId.slice(0, 8)}` : "Select a conversation"}
									</h2>
								</CardHeader>
								<CardContent className='flex-1 flex flex-col'>
									{selectedJobId ?
										<>
											{/* Messages */}
											<div className='flex-1 overflow-y-auto space-y-4 mb-4'>
												{messages?.map((message) => (
													<div
														key={message.id}
														className={`flex ${message.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
														<div
															className={`max-w-[70%] rounded-lg p-3 ${
																message.sender_id === user?.id ?
																	"bg-primary-600 text-white"
																:	"bg-gray-100 text-gray-900"
															}`}>
															<p className='text-sm'>{message.message}</p>
															<p
																className={`text-xs mt-1 ${
																	message.sender_id === user?.id ? "text-primary-100" : "text-gray-500"
																}`}>
																{formatDateTime(message.created_at)}
															</p>
														</div>
													</div>
												))}
											</div>

											{/* Message Input */}
											<form
												onSubmit={handleSendMessage}
												className='flex gap-2'>
												<Input
													value={messageText}
													onChange={(e) => setMessageText(e.target.value)}
													placeholder='Type a message...'
													className='flex-1'
												/>
												<Button
													type='submit'
													disabled={!messageText.trim()}>
													<Send className='h-4 w-4' />
												</Button>
											</form>
										</>
									:	<div className='flex-1 flex items-center justify-center text-gray-500'>
											Select a conversation to start messaging
										</div>
									}
								</CardContent>
							</Card>
						</div>
					</div>
				}
			</div>
		</Layout>
	);
}
