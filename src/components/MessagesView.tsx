import React, { useState } from 'react';
import { MessageSquare, Send, User as UserIcon, Clock, CheckCheck, Laptop } from 'lucide-react';
import { InAppMessage, User } from '../types';

interface MessagesViewProps {
  messages: InAppMessage[];
  currentUser: User | null;
  sendMessage: (receiverId: string, listingId: string, listingTitle: string, text: string) => void;
  navigateTo: (route: string, params?: any) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  messages = [],
  currentUser,
  sendMessage,
  navigateTo,
}) => {
  const [replyText, setReplyText] = useState<string>('');
  const [activeListingId, setActiveListingId] = useState<string>((messages || [])[0]?.listing_id || '');

  // Group messages by listing
  const listingGroups = Array.from(new Set((messages || []).map((m) => m.listing_id)));
  const currentListingMessages = (messages || []).filter((m) => m.listing_id === activeListingId);
  const activeMessageObj = (messages || []).find((m) => m.listing_id === activeListingId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeMessageObj || !currentUser) return;

    const receiver =
      activeMessageObj.sender_id === currentUser.id
        ? activeMessageObj.receiver_id
        : activeMessageObj.sender_id;

    sendMessage(receiver, activeMessageObj.listing_id, activeMessageObj.listing_title, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-outline-variant pb-3">
        <h1 className="text-2xl font-extrabold text-on-surface font-display flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-whatsapp-dark" />
          <span>Messages & Inquiries Inbox</span>
        </h1>
        <p className="text-xs text-on-surface-variant">
          In-app communication between laptop buyers and sellers.
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-lg p-12 text-center border border-outline-variant space-y-3">
          <MessageSquare className="w-12 h-12 text-outline mx-auto" />
          <h3 className="font-bold text-on-surface text-sm">No active message threads</h3>
          <p className="text-xs text-on-surface-variant">
            When you inquire about a P2P listing or a buyer contacts you, threads will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-surface-container-lowest rounded-lg border border-outline-variant shadow-sm overflow-hidden min-h-[500px]">
          {/* Threads List (4 cols) */}
          <div className="md:col-span-4 border-r border-outline-variant p-4 space-y-2 bg-surface-container-low/50">
            <h3 className="font-bold text-on-surface text-xs px-2 mb-2">Conversations</h3>
            {listingGroups.map((lid) => {
              const msg = messages.find((m) => m.listing_id === lid);
              if (!msg) return null;
              const isSelected = activeListingId === lid;
              return (
                <button
                  key={lid}
                  onClick={() => setActiveListingId(lid)}
                  className={`w-full text-left p-3 rounded transition-all ${
                    isSelected ? 'bg-surface-container-lowest shadow-md border border-outline-variant' : 'hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-whatsapp/10 text-whatsapp-dark flex items-center justify-center font-bold text-xs">
                      {msg.sender_name[0]}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-on-surface truncate">{msg.sender_name}</span>
                        <span className="text-[10px] text-outline">{msg.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant truncate">{msg.listing_title}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat Messages Panel (8 cols) */}
          <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-4">
            {/* Header */}
            {activeMessageObj && (
              <div className="border-b border-outline-variant pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-on-surface text-sm">{activeMessageObj.listing_title}</h4>
                  <p className="text-xs text-outline">Thread with {activeMessageObj.sender_name}</p>
                </div>
                <button
                  onClick={() => navigateTo('marketplace_detail', { p2pId: activeMessageObj.listing_id })}
                  className="text-xs font-bold text-whatsapp-dark hover:underline"
                >
                  View Listing Ad →
                </button>
              </div>
            )}

            {/* Message Bubble Feed */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-80 pr-2">
              {currentListingMessages.map((m) => {
                const isMe = m.sender_id === currentUser?.id;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-md p-3.5 rounded text-xs space-y-1 shadow-sm ${
                        isMe
                          ? 'bg-whatsapp text-white rounded-br-none'
                          : 'bg-surface-container-low text-on-surface rounded-bl-none'
                      }`}
                    >
                      <span className={`text-[10px] font-bold block ${isMe ? 'text-white/80' : 'text-on-surface-variant'}`}>
                        {m.sender_name}
                      </span>
                      <p className="leading-relaxed">{m.text}</p>
                      <span className={`text-[9px] block text-right ${isMe ? 'text-white/70' : 'text-outline'}`}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-outline-variant">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply message..."
                required
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-whatsapp"
              />
              <button
                type="submit"
                className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
