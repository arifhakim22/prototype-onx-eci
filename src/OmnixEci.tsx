import React, { useState } from 'react';
import conversationsData from './assets/json/conversation_ig.json';
import customerData from './assets/json/customer.json';
import transactionData from './assets/json/transaction.json';
import paymentData from './assets/json/payment.json';
import sidebarIcon1 from './assets/sidebar/1.svg';
import sidebarIcon2 from './assets/sidebar/2.svg';
import sidebarIcon3 from './assets/sidebar/3.svg';
import sidebarIcon4 from './assets/sidebar/4.svg';
import sidebarIcon5 from './assets/sidebar/5.svg';
import iconChat from './assets/sidebar/chat.svg';
import iconFbMessage from './assets/sidebar/fb_message.svg';
import iconIgMessage from './assets/sidebar/ig_message.svg';
import iconWhatsapp from './assets/sidebar/WhatsApp.svg';
import iconAppStore from './assets/sidebar/app_store.svg';
import iconPlaystore from './assets/sidebar/Playstore.svg';
import iconGoogleMaps from './assets/sidebar/google_review.svg';
import iconManual from './assets/sidebar/Manual.svg';
import emailIcon from './assets/sidebar/Email.svg';
import fbCommentIcon from './assets/sidebar/Facebook.svg';
import igCommentIcon from './assets/sidebar/ig_message.svg';

interface ChannelItem {
  id: string;
  name: string;
  badge?: string | number;
  icon: string;
  color?: string;
  dot?: boolean;
}

interface Conversation {
  id: string;
  avatar: string;
  time: string;
  lastMessage: string;
  source: string;
  handle: string;
  customerCode: string;
  messages: Array<{
    id: string;
    sender?: string;
    avatar: string;
    text: string;
    time: string;
    isSelf: boolean;
  }>;
  journey: Array<{
    id: string;
    type: string;
    date: string;
    cases: number;
    tickets: number;
    agent: string;
  }>;
}

export default function OmnixEci() {
  const [activeChannel, setActiveChannel] = useState<string>('ig_message');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'handling' | 'queue' | 'history'>('handling');
  const [activeReplyTab, setActiveReplyTab] = useState<'reply' | 'note'>('reply');
  const [activeJourneyTab, setActiveJourneyTab] = useState<'journey' | 'ticket'>('journey');
  const [replyText, setReplyText] = useState<string>('');

  // Channels configuration matching the image
  const voiceChannels: ChannelItem[] = [
    // { id: 'voice_ami', name: 'Voice ami', badge: 1, icon: '📞', dot: true }
  ];

  const otherChannels: ChannelItem[] = [
    { id: 'appstore', name: 'Appstore', badge: 0, icon: iconAppStore },
    { id: 'playstore', name: 'Playstore', badge: 0, icon: iconPlaystore },
    { id: 'google_review', name: 'Google Rev...', badge: 0, icon: iconGoogleMaps },
    { id: 'manual', name: 'Manual', badge: 0, icon: iconManual, dot: true },
  ];

  const rtcChannels: ChannelItem[] = [
    { id: 'chat', name: 'Chat', badge: 0, icon: iconChat },
    { id: 'fb_message', name: 'FB Message', badge: 0, icon: iconFbMessage },
    { id: 'ig_message', name: 'IG Message', badge: 3, icon: iconIgMessage },
    { id: 'whatsapp', name: 'Whatsapp', badge: 0, icon: iconWhatsapp }
  ];

  const socialChannels: ChannelItem[] = [
    { id: 'email', name: 'Email', badge: 0, icon: emailIcon },
    { id: 'fb_comment', name: 'FB Comment', badge: 0, icon: fbCommentIcon },
    { id: 'ig_comment', name: 'IG Comment', badge: 0, icon: igCommentIcon }
    // { id: 'tiktok_comment', name: 'Tiktok Com...', icon: '💬' },
    // { id: 'tw_comment', name: 'TW Comment', icon: '💬' }
  ];

  // Dynamic interactive conversations dataset
  const [conversations, setConversations] = useState<Record<string, Conversation[]>>({
    ig_message: conversationsData as Conversation[]
  });

  const [activeConvId, setActiveConvId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [eciCustomerOverrides, setEciCustomerOverrides] = useState<Record<string, string>>({});

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailCustomerCode, setDetailCustomerCode] = useState<string>('');
  const [activeDetailTab, setActiveDetailTab] = useState<string>('sales');
  const [salesStartDate, setSalesStartDate] = useState<string>('');
  const [salesEndDate, setSalesEndDate] = useState<string>('');
  const [salesSearchQuery, setSalesSearchQuery] = useState<string>('');
  const [woSearchQuery, setWoSearchQuery] = useState<string>('');
  const [doSearchQuery, setDoSearchQuery] = useState<string>('');

  // Find active conversation object
  const activeChannelConvs = conversations[activeChannel] || [];
  const activeConv = activeChannelConvs.find(c => c.id === activeConvId) || activeChannelConvs[0];

  const activeCustomer = activeConv
    ? customerData.find(cust => cust.CustomerCode === activeConv.customerCode)
    : null;

  const eciCustomerCode = activeConv ? (eciCustomerOverrides[activeConv.id] || activeConv.customerCode) : '';
  const eciCustomer = eciCustomerCode
    ? customerData.find(cust => cust.CustomerCode === eciCustomerCode)
    : null;

  const displayNameEci = eciCustomer ? eciCustomer.CustomerName : '';

  const getSenderName = (msg: any) => {
    if (msg.isSelf) {
      return msg.sender || (activeCustomer ? activeCustomer.CustomerName : 'Customer');
    }
    return msg.sender || 'Agent Yola';
  };

  const formatIndonesianDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const day = parseInt(parts[2], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    return dateStr;
  };

  const handleSendMessage = () => {
    if (!replyText.trim() || !activeConv) return;

    const newMessage = {
      id: Math.random().toString(),
      sender: 'Agent Yola',
      avatar: 'A',
      text: replyText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: false
    };

    setConversations(prev => {
      const channelConvs = prev[activeChannel] || [];
      const updatedConvs = channelConvs.map(c => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: replyText,
            messages: [...c.messages, newMessage]
          };
        }
        return c;
      });
      return {
        ...prev,
        [activeChannel]: updatedConvs
      };
    });

    setReplyText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F3F4F6] text-slate-800 font-sans overflow-hidden antialiased">



      {/* MAIN CONTAINER */}
      <div className="flex-1 flex overflow-hidden">

        {/* 2. VERTICAL NARROW NAVIGATION BAR */}
        <nav className="w-[60px] p-2 bg-[#3B2F9F] flex flex-col justify-between items-center py-0 shrink-0 z-20 select-none">
          <div className="flex flex-col items-center gap-4 w-full">
            {/* Logo block */}
            <div className="w-full h-14 flex items-center justify-center shrink-0 shadow-sm border-b border-[#5a48ce]">
              <img src="/logo.svg" alt="Logo" className="h-8" />
            </div>

            {/* Nav Menu */}
            <div className="flex flex-col gap-4 w-full px-2 mt-4 items-center">
              {/* Icon 1: Active Chat/Inbox bubble with round base */}
              <div className="w-12 h-12 rounded-2xl bg-[#6F5CE6] text-white flex items-center justify-center cursor-pointer shadow-sm hover:brightness-110 transition-all">
                <img src={sidebarIcon1} className="w-6 h-6" alt="Chat" />
              </div>

              {/* Icon 2: Ticket / Coupon */}
              <div className="w-12 h-12 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center cursor-pointer transition-all">
                <img src={sidebarIcon2} className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Ticket" />
              </div>

              {/* Icon 3: Sheet / Document */}
              <div className="w-12 h-12 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center cursor-pointer transition-all">
                <img src={sidebarIcon3} className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Documents" />
              </div>

              {/* Icon 4: Home */}
              <div className="w-12 h-12 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center cursor-pointer transition-all">
                <img src={sidebarIcon4} className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Home" />
              </div>

              {/* Icon 5: Users/Groups */}
              <div className="w-12 h-12 rounded-2xl text-white/50 hover:text-white hover:bg-white/5 flex items-center justify-center cursor-pointer transition-all">
                <img src={sidebarIcon5} className="w-6 h-6 opacity-60 hover:opacity-100 transition-opacity" alt="Users" />
              </div>
            </div>
          </div>

          {/* Bottom Menu */}
          <div className="flex flex-col gap-4 w-full px-2 mb-4 items-center">
            {/* Phone with check badge */}
            <div className="w-12 h-12 rounded-2xl bg-[#5241D9]/40 text-white flex items-center justify-center relative cursor-pointer hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#10B981] rounded-full flex items-center justify-center border-2 border-[#3B2F9F] text-[7px] text-white font-extrabold select-none">
                ✓
              </span>
            </div>

            {/* Bubble chat with three dots */}
            <div className="w-12 h-12 rounded-2xl bg-[#5241D9]/40 text-white/90 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                <circle cx="12" cy="10" r="1.2" fill="currentColor" />
                <circle cx="16" cy="10" r="1.2" fill="currentColor" />
              </svg>
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* 1. TOP HEADER BAR */}
          <header className="h-14 mb-1 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm relative z-30">
            <div className="flex items-center gap-3">
              <button className="text-slate-500 hover:text-slate-700 focus:outline-none p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
              <span className="text-sm font-bold text-[#1E1B4B]">Task</span>
            </div>

            <div className="flex items-center gap-4">
              <button className="border border-slate-200 hover:bg-slate-50 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors text-slate-700">
                Service
              </button>
              <button className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </button>

              <div className="relative">
                <button className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors relative">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center scale-90 border border-white">
                    6
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 leading-none">Agent Yola</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase font-mono tracking-wider mt-0.5">AGENT</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
              </div>
            </div>
          </header>

          <div className='flex-1 flex overflow-hidden'>

            {/* 3. SIDEBAR 1: CHANNELS LIST */}
            <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-y-auto scrollbar-thin select-none">

              <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Total Handling</span>
                <span className="w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  3
                </span>
              </div>

              {/* Channels Sections */}
              <div className="p-2 space-y-4">

                {/* Section Voice */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">Voice</p>
                  <div className="space-y-0.5">
                    {voiceChannels.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveChannel(c.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeChannel === c.id ? 'bg-[#EEF2F6] text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.icon.startsWith('data:') || c.icon.startsWith('/') ? <img src={c.icon} className="w-4 h-4" alt={c.name} /> : <span>{c.icon}</span>}
                          <span>{c.name}</span>
                          {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                        {c.badge && (
                          <span className="bg-emerald-500 text-white font-semibold px-1.5 py-0.5 rounded-full text-[9px]">
                            {c.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Others */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">Others</p>
                  <div className="space-y-0.5">
                    {otherChannels.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveChannel(c.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeChannel === c.id ? 'bg-[#EEF2F6] text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.icon.startsWith('data:') || c.icon.startsWith('/') ? <img src={c.icon} className="w-4 h-4" alt={c.name} /> : <span>{c.icon}</span>}
                          <span>{c.name}</span>
                          {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                        {c.badge && (
                          <span className="bg-emerald-500 text-white font-semibold px-1.5 py-0.5 rounded-full text-[9px]">
                            {c.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section RTC */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">RTC</p>
                  <div className="space-y-0.5">
                    {rtcChannels.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveChannel(c.id);
                          // Reset active conversation index to first item of this channel if any
                          const convs = conversations[c.id] || [];
                          if (convs.length > 0) setActiveConvId(convs[0].id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeChannel === c.id ? 'bg-[#E0E7FF] text-[#312E81] font-bold border-l-4 border-[#4F46E5] rounded-l-none' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.icon.startsWith('data:') || c.icon.startsWith('/') ? <img src={c.icon} className="w-4 h-4" alt={c.name} /> : <span>{c.icon}</span>}
                          <span>{c.name}</span>
                          {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                        {c.badge && (
                          <span className="bg-amber-500 text-white font-semibold px-1.5 py-0.5 rounded-full text-[9px]">
                            {c.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Social Media & Email */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-1.5">Social Media & Email</p>
                  <div className="space-y-0.5">
                    {socialChannels.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setActiveChannel(c.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${activeChannel === c.id ? 'bg-[#EEF2F6] text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {c.icon.startsWith('data:') || c.icon.startsWith('/') ? <img src={c.icon} className="w-4 h-4" alt={c.name} /> : <span>{c.icon}</span>}
                          <span>{c.name}</span>
                          {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                        </div>
                        {c.badge && (
                          <span className="bg-rose-500 text-white font-semibold px-1.5 py-0.5 rounded-full text-[9px]">
                            {c.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </aside>

            {/* 4. SIDEBAR 2: WORKSPACE CONVERSATIONS */}
            <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 overflow-hidden">

              <div className="p-4 border-b border-slate-100 shrink-0">
                <h2 className="text-base font-bold text-slate-950">Workspace</h2>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 mt-3 text-xs">
                  <button
                    onClick={() => setActiveWorkspaceTab('handling')}
                    className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors ${activeWorkspaceTab === 'handling' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Handling <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded ml-0.5">3</span>
                  </button>
                  <button
                    onClick={() => setActiveWorkspaceTab('queue')}
                    className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors ${activeWorkspaceTab === 'queue' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    Queue <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded ml-0.5">0</span>
                  </button>
                  <button
                    onClick={() => setActiveWorkspaceTab('history')}
                    className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors ${activeWorkspaceTab === 'history' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    History
                  </button>
                </div>

                {/* Instruction line */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3">
                  <span>Click arrow button to have a conversation</span>
                  {/* <button className="w-5 h-5 bg-[#4F46E5] text-white rounded-full flex items-center justify-center text-xs hover:bg-[#4338CA] transition-colors shadow-sm">
                    ↗
                  </button> */}
                </div>
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {activeChannelConvs.length === 0 ? (
                  <div className="text-center text-xs text-slate-400 py-12 italic">
                    No active conversations for this channel.
                  </div>
                ) : (
                  activeChannelConvs.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${activeConvId === conv.id
                        ? 'border-indigo-200 bg-indigo-50/20 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar with dynamic channel overlay */}
                        <div className="relative shrink-0 select-none">
                          <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center text-sm font-bold font-mono">
                            {conv.avatar}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full overflow-hidden border border-white">
                            <img src={iconIgMessage} className="w-full h-full object-cover" alt="channel icon" />
                          </div>
                        </div>

                        {/* Text info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5 gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">
                              {customerData.find(cust => cust.CustomerCode === conv.customerCode)?.CustomerName || 'No Name'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold whitespace-nowrap">{conv.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate leading-snug">
                            {conv.lastMessage}
                          </p>
                          <div className="text-[9px] text-slate-400 mt-1 select-none font-semibold">
                            Source : <span className="text-slate-500 font-bold">{conv.source}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                <button className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 font-bold py-3 transition-colors mt-2 select-none">
                  Load more history
                </button>
              </div>
            </aside>

            {/* 5. MAIN CHAT PANEL (CENTER) */}
            <main className="flex-1 bg-[#F9FAFB] flex flex-col h-full overflow-hidden relative">
              {activeConv ? (
                <>
                  {/* Chat Header */}
                  <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 flex items-center justify-between shadow-sm relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                        {activeConv.avatar}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-none">
                          {activeCustomer ? activeCustomer.CustomerName : 'No Name'}
                        </h3>
                        <div className="flex gap-2 items-center text-[10px] text-slate-400 font-mono mt-1">
                          <span>{activeConv.handle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-[11px]  flex gap-2">
                        <p className="text-slate-400">Waiting Time: <span className="text-rose-500 font-bold">2037:22:49</span></p>
                        <p className="text-slate-400">Handling Time: <span className="text-rose-500 font-bold">00:19</span></p>
                      </div>

                      <button className="border border-slate-200 hover:bg-slate-50 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors text-slate-700 active:scale-95">
                        Transfer
                      </button>

                      <button className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all active:scale-95 shadow-sm">
                        End Interaction
                      </button>
                    </div>
                  </div>

                  {/* Chat Messages List */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* <div className="w-full text-center my-3 select-none">
                      <button className="border border-indigo-200 text-indigo-600 hover:bg-indigo-50/50 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors font-mono uppercase tracking-wider">
                        Show previous interaction
                      </button>
                    </div>

                    <div className="flex items-center justify-center my-4 select-none">
                      <span className="bg-slate-200 text-slate-500 px-3 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider">
                        2026-04-20
                      </span>
                    </div> */}

                    {activeConv.messages.map(msg => (
                      <div key={msg.id} className={`flex gap-3 max-w-[70%] ${!msg.isSelf ? 'ml-auto flex-row-reverse' : ''}`}>
                        {/* <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold font-mono shrink-0 shadow-sm border border-slate-200">
                          {msg.avatar}
                        </div> */}
                        <div>
                          <div className={`p-3.5 rounded-2xl shadow-sm leading-relaxed text-sm ${!msg.isSelf
                            ? 'bg-[#4F46E5] text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                            }`}>
                            <p className="font-bold text-[10px] opacity-75 mb-0.5">{getSenderName(msg)}</p>
                            <p>{msg.text}</p>
                          </div>
                          <span className={`text-[9px] text-slate-400 font-mono mt-1 block ${!msg.isSelf ? 'text-right' : ''}`}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}

                  </div>

                  {/* Chat Reply Area */}
                  <div className="bg-white border-t border-slate-200 p-4 shrink-0 flex flex-col gap-3 shadow-inner relative z-10">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 text-xs">
                      <button
                        onClick={() => setActiveReplyTab('reply')}
                        className={`pb-2 px-4 font-bold border-b-2 transition-colors ${activeReplyTab === 'reply' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => setActiveReplyTab('note')}
                        className={`pb-2 px-4 font-bold border-b-2 transition-colors ${activeReplyTab === 'note' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Private Note
                      </button>
                    </div>

                    {/* Reply Input block */}
                    <div className="relative border border-slate-200 rounded-xl bg-slate-50 focus-within:bg-white focus-within:border-indigo-400 transition-colors p-2">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Write something here. Shift + enter for new line."
                        className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-slate-800 placeholder:text-slate-400 px-2 py-1 leading-relaxed"
                      />

                      <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 mt-1 select-none">
                        <span>Word count: {replyText.trim().split(/\s+/).filter(Boolean).length}</span>
                        <span>{1000 - replyText.length}/1000 character remaining</span>
                      </div>
                    </div>

                    {/* Reply Toolbar */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-colors" title="Emoticons">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#525252ff"><path d="M620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm263.5 221.5Q659-337 684-400H276q25 63 80.5 101.5T480-260q68 0 123.5-38.5ZM324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM480-480Zm227 227q93-93 93-227t-93-227q-93-93-227-93t-227 93q-93 93-93 227t93 227q93 93 227 93t227-93Z" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-colors" title="Attach file">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#525252ff"><path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-colors" title="Templates">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#525252ff"><path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" /></svg>
                        </button>
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-colors" title="Insert links">
                          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#525252ff"><path d="M318-120q-82 0-140-58t-58-140q0-40 15-76t43-64l134-133 56 56-134 134q-17 17-25.5 38.5T200-318q0 49 34.5 83.5T318-200q23 0 45-8.5t39-25.5l133-134 57 57-134 133q-28 28-64 43t-76 15Zm79-220-57-57 223-223 57 57-223 223Zm251-28-56-57 134-133q17-17 25-38t8-44q0-50-34-85t-84-35q-23 0-44.5 8.5T558-726L425-592l-57-56 134-134q28-28 64-43t76-15q82 0 139.5 58T839-641q0 39-14.5 75T782-502L648-368Z" /></svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition-colors" title="Fullscreen text">🔎</button>
                        <button
                          onClick={handleSendMessage}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-5 rounded-lg transition-all active:scale-95 shadow-sm"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <p className="text-sm text-slate-400 italic">Select a conversation to start chatting</p>
                </div>
              )}
            </main>

            {/* 6. RIGHTMOST CUSTOMER INFORMATION PANEL */}
            <aside className="w-90 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 overflow-hidden select-none">
              {activeConv ? (
                <>
                  {/* Customer Information Section */}
                  <div className="p-5 border-b border-slate-200 shrink-0">
                    <h3 className="text-[13px] font-bold text-slate-700 tracking-tight mb-4">Customer Information</h3>

                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-sm select-none">
                        {activeCustomer ? activeCustomer.CustomerName.charAt(0).toUpperCase() : 'N'}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-none tracking-wide">{activeCustomer ? activeCustomer.CustomerName.toUpperCase() : 'NO NAME'}</h4>
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a20.373 20.373 0 01-6.708-7.77c-.136-.387.05-1.07.418-1.385l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span className="font-medium text-[11px]">{activeCustomer ? activeCustomer.HPNumber : 'Not Available'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                            </svg>
                            <span className="font-medium text-[11px]">{activeCustomer ? activeCustomer.Email : 'Not Available'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information ECI Section */}
                  <div className="p-5 border-b border-slate-200 shrink-0">
                    <h3 className="text-[13px] font-bold text-slate-700 tracking-tight mb-4">Customer Information ECI</h3>

                    <div className="flex gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-sm shrink-0 select-none mt-0.5">
                        {displayNameEci ? displayNameEci.charAt(0).toUpperCase() : 'N'}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-none tracking-wide">{displayNameEci || 'No Name'}</h4>

                        <div className="space-y-2.5 pt-1">
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.387a20.373 20.373 0 01-6.708-7.77c-.136-.387.05-1.07.418-1.385l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{eciCustomer ? eciCustomer.HPNumber : 'Not Available'}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25" />
                            </svg>
                            <span>{eciCustomer ? eciCustomer.Email : 'Not Available'}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                            <span>{eciCustomer ? (eciCustomer.SexName === 'MALE' ? 'Laki-Laki' : 'Perempuan') : 'Not Available'}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-slate-400 shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z" />
                            </svg>
                            <span className="leading-tight">{eciCustomer ? eciCustomer.Address : 'Not Available'}</span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" height="14px" viewBox="0 -960 960 960" width="14px" fill="#94a3b8"><path d="M160-440v80h640v-80H160Zm0-440h640q33 0 56.5 23.5T880-800v440q0 33-23.5 56.5T800-280H640v200l-160-80-160 80v-200H160q-33 0-56.5-23.5T80-360v-440q0-33 23.5-56.5T160-880Zm0 320h640v-240H160v240Zm0 200v-440 440Z" /></svg>

                            <span className="leading-tight">{eciCustomer ? eciCustomer.StatusMembership : 'Not Available'}</span>
                          </div>

                          {!eciCustomer && (
                            <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] font-semibold leading-relaxed">
                              <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <div>
                                <p>Data customer tidak ditemukan pada sistem.</p>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </div>



                    {/* Bottom Row inside card */}
                    <div className="flex items-center justify-between mt-5 pt-3">
                      <div
                        onClick={() => {
                          setModalSearchQuery('');
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <span className="text-[11px] font-medium text-slate-400">Cari Data Customer</span>
                      </div>

                      <button
                        onClick={() => {
                          setDetailCustomerCode(eciCustomer ? eciCustomer.CustomerCode : '');
                          setActiveDetailTab('sales');
                          setIsDetailModalOpen(true);
                        }}
                        className="border border-slate-300 hover:border-[#6F5CE6] hover:text-[#6F5CE6] hover:bg-[#6F5CE6]/5 text-[#6F5CE6] text-[11px] font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                      >
                        Detail Customer
                      </button>
                    </div>
                  </div>

                  {/* Journey Tabs */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex border-b border-slate-100 text-xs shrink-0 px-2 pt-2 bg-slate-50/50">
                      <button
                        onClick={() => setActiveJourneyTab('journey')}
                        className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors ${activeJourneyTab === 'journey' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Journey Interaction
                      </button>
                      <button
                        onClick={() => setActiveJourneyTab('ticket')}
                        className={`flex-1 pb-2 font-bold text-center border-b-2 transition-colors ${activeJourneyTab === 'ticket' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                      >
                        Journey Ticket
                      </button>
                    </div>

                    {/* Filter and Timeline */}
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                      <div className="flex items-center justify-between text-xs mb-3 shrink-0">
                        <span className="text-slate-400 font-semibold">Filter</span>
                        <select className="border border-slate-200 rounded-lg text-xs font-semibold px-2.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-400 bg-white">
                          <option>All</option>
                          <option>IG Message</option>
                          <option>WhatsApp</option>
                        </select>
                      </div>

                      {/* Scrollable Timeline */}
                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
                        <div className="text-center text-xs text-slate-400 py-12 italic">
                          No journey ticket data found.
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 italic text-xs">
                  No customer loaded
                </div>
              )}
            </aside>

          </div>
        </div>

      </div>

      {/* Cari Data Customer Modal Popup */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-5xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Cari Data Customer</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Search Bar Row */}
              <div className="flex justify-end shrink-0">
                <div className="relative w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-5 py-3">Customer Code</th>
                        <th className="px-5 py-3">Customer Name</th>
                        <th className="px-5 py-3">No. Handphone</th>
                        <th className="px-5 py-3">Email</th>
                        <th className="px-5 py-3">Date Birth</th>
                        <th className="px-5 py-3">Gender</th>
                        <th className="px-5 py-3">Member Activation Date</th>
                        <th className="px-5 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                      {customerData.filter(cust => {
                        const q = modalSearchQuery.toLowerCase();
                        return (
                          cust.CustomerCode.toLowerCase().includes(q) ||
                          cust.CustomerName.toLowerCase().includes(q) ||
                          cust.HPNumber.toLowerCase().includes(q) ||
                          (cust.Email && cust.Email.toLowerCase().includes(q))
                        );
                      }).map((cust, idx) => (
                        <tr key={cust.CustomerCode} className={`hover:bg-slate-50/70 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}>
                          <td className="px-5 py-3.5 font-mono text-slate-600">{cust.CustomerCode}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-800">{cust.CustomerName}</td>
                          <td className="px-5 py-3.5">{cust.HPNumber}</td>
                          <td className="px-5 py-3.5 text-slate-500">{cust.Email || '-'}</td>
                          <td className="px-5 py-3.5">
                            {cust.DateOfBirth ? cust.DateOfBirth.split('-').reverse().join('/') : '-'}
                          </td>
                          <td className="px-5 py-3.5">
                            {cust.SexName === 'MALE' ? 'Laki-Laki' : 'Perempuan'}
                          </td>
                          <td className="px-5 py-3.5">
                            {cust.JoinDate ? cust.JoinDate.split('-').reverse().join('/') : '-'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => {
                                setEciCustomerOverrides(prev => ({
                                  ...prev,
                                  [activeConv.id]: cust.CustomerCode
                                }));
                                setIsModalOpen(false);
                              }}
                              className="border border-indigo-200 hover:border-indigo-500 text-indigo-600 hover:bg-indigo-50/50 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-[0.97]"
                            >
                              Choose
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Row */}
              <div className="flex items-center gap-2 select-none justify-start px-1 pt-2 shrink-0">
                <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium mr-2">01</span>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg">02</span>
                <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium ml-2 mr-2">03</span>
                <span className="text-xs text-slate-400 font-medium">...</span>
                <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium ml-2">04</span>
                <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium ml-2">05</span>
                <span className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium ml-2">06</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Customer Modal Popup */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] max-w-7xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Customer Information</h2>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const detailCust = customerData.find(c => c.CustomerCode === detailCustomerCode) || {
                CustomerName: 'No Name',
                CustomerCode: 'not available',
                HPNumber: 'not available',
                SexName: 'not available',
                DateOfBirth: null,
                JoinDate: null,
                CityName: 'not available',
                StateName: 'not available',
                Address: 'not available',
                Email: 'not available'
              };

              const custTransactions = transactionData.filter((t: any) => t.CustomerCode === detailCustomerCode);
              const custPayments = paymentData.filter((p: any) => p.CustomerCode === detailCustomerCode);

              return (
                <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">

                  {/* Top Customer Brief Info */}
                  <div className="flex items-start gap-4 pb-4 border-b border-slate-100 shrink-0">
                    <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-base select-none mt-0.5 shrink-0">
                      {detailCust.CustomerName ? detailCust.CustomerName.charAt(0).toUpperCase() : 'N'}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight tracking-wide">{detailCust.CustomerName}</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">{detailCust.Email || 'not available'}</p>
                    </div>
                  </div>

                  {/* Customer Information Grid Fields */}
                  <div className="grid grid-cols-6 gap-6 text-[10px] pb-6 border-b border-slate-100 shrink-0">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Customer Code</span>
                        <span className="font-bold text-slate-800 text-[11px] font-mono">{detailCust.CustomerCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">No. Telephone</span>
                        <span className="font-bold text-slate-800 text-[11px]">{detailCust.HPNumber}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Gender</span>
                        <span className="font-bold text-slate-800 text-[11px]">
                          {detailCust.SexName === 'not available'
                            ? 'not available'
                            : (detailCust.SexName === 'MALE' ? 'Laki-Laki' : 'Perempuan')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Date Birth</span>
                        <span className="font-bold text-slate-800 text-[11px]">{detailCust.DateOfBirth ? detailCust.DateOfBirth.split('-').reverse().join('/') : 'not available'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Member Activation Date</span>
                        <span className="font-bold text-slate-800 text-[11px]">{detailCust.JoinDate ? formatIndonesianDate(detailCust.JoinDate) : 'not available'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Status Member</span>
                        <span className="font-bold text-slate-800 text-[11px] font-mono">{detailCust.CustomerCode === 'not available' ? 'not available' : 'Member'}</span>
                      </div>

                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Agent Code</span>
                        <span className="font-bold text-slate-800 text-[11px] font-mono">{detailCust.CustomerCode === 'not available' ? 'not available' : '1231231'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Balance Point</span>
                        <span className="font-bold text-slate-800 text-[11px] font-mono">60</span>
                      </div>

                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Kota</span>
                        <span className="font-bold text-slate-800 text-[11px]">{detailCust.CityName || 'not available'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Provinsi</span>
                        <span className="font-bold text-slate-800 text-[11px]">{detailCust.StateName || 'not available'}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-semibold block mb-0.5">Alamat Domisili</span>
                        <span className="font-bold text-slate-800 text-[11px] leading-tight block">{detailCust.Address || 'not available'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4 Tabs Menu at the bottom */}
                  <div className="flex border-b border-slate-200 text-xs shrink-0 select-none">
                    <button
                      onClick={() => setActiveDetailTab('sales')}
                      className={`pb-2 px-5 font-bold border-b-2 transition-all duration-150 ${activeDetailTab === 'sales' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Data Sales & Payment
                    </button>
                    <button
                      onClick={() => setActiveDetailTab('point')}
                      className={`pb-2 px-5 font-bold border-b-2 transition-all duration-150 ${activeDetailTab === 'point' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Data Point E-Cityzen
                    </button>
                    {/* <button
                      onClick={() => setActiveDetailTab('work_order')}
                      className={`pb-2 px-5 font-bold border-b-2 transition-all duration-150 ${activeDetailTab === 'work_order' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Data Work Order Pemasangan via GKT
                    </button> */}
                    <button
                      onClick={() => setActiveDetailTab('delivery_order')}
                      className={`pb-2 px-5 font-bold border-b-2 transition-all duration-150 ${activeDetailTab === 'delivery_order' ? 'border-[#4F46E5] text-[#4F46E5]' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                      Data Delivery Order via DC14
                    </button>
                  </div>

                  {/* Tab Contents Area */}
                  <div className="flex-1 min-h-[250px]">
                    {activeDetailTab === 'sales' && (() => {
                      const filteredTx = custTransactions.filter((t: any) => {
                        if (salesSearchQuery.trim() !== '') {
                          const q = salesSearchQuery.toLowerCase();
                          if (!t.POSInvoice.toLowerCase().includes(q)) return false;
                        }
                        if (t.CalendarDate) {
                          if (salesStartDate && t.CalendarDate < salesStartDate) return false;
                          if (salesEndDate && t.CalendarDate > salesEndDate) return false;
                        }
                        return true;
                      });

                      const filteredPay = custPayments.filter((p: any) => {
                        if (salesSearchQuery.trim() !== '') {
                          const q = salesSearchQuery.toLowerCase();
                          if (!p.POSInvoice.toLowerCase().includes(q)) return false;
                        }
                        if (p.PaymentDate) {
                          if (salesStartDate && p.PaymentDate < salesStartDate) return false;
                          if (salesEndDate && p.PaymentDate > salesEndDate) return false;
                        }
                        return true;
                      });

                      return (
                        <div className="space-y-6">
                          {/* Filter date & Search row */}
                          <div className="flex items-end justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2 shrink-0 text-[10px] select-none">
                            <div className="flex gap-4 items-center">
                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={salesStartDate}
                                  onChange={(e) => setSalesStartDate(e.target.value)}
                                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 w-44"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 font-bold mb-1">Start End</label>
                                <input
                                  type="date"
                                  value={salesEndDate}
                                  onChange={(e) => setSalesEndDate(e.target.value)}
                                  className="border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 w-44"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-slate-400 font-bold mb-1 text-right">Search Invoice</label>
                              <div className="relative w-64">
                                <input
                                  type="text"
                                  value={salesSearchQuery}
                                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                                  placeholder="Search Invoice"
                                  className="w-full pr-8 pl-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 text-xs"
                                />
                                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Data Sales Sub-table */}
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Table Data Sales</h4>
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-2.5">POS Invoice</th>
                                    <th className="px-4 py-2.5">Reference ID</th>
                                    <th className="px-4 py-2.5">Calendar Date</th>
                                    <th className="px-4 py-2.5">Product Code</th>
                                    <th className="px-4 py-2.5">Brand Name</th>
                                    <th className="px-4 py-2.5">Department Name</th>
                                    <th className="px-4 py-2.5">Category Name</th>
                                    <th className="px-4 py-2.5">Subcategory Name</th>
                                    <th className="px-4 py-2.5">Store Code</th>
                                    <th className="px-4 py-2.5">Store Name</th>
                                    <th className="px-4 py-2.5 text-center">QTY Sales</th>
                                    <th className="px-4 py-2.5">Agent</th>
                                    <th className="px-4 py-2.5">Channel TRX</th>
                                    <th className="px-4 py-2.5">Customer Status</th>
                                    <th className="px-4 py-2.5 text-right">Gross Sales Include VAT</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-600">
                                  {filteredTx.length === 0 ? (
                                    <tr>
                                      <td colSpan={15} className="px-4 py-8 text-center text-slate-400 italic">No sales transactions found.</td>
                                    </tr>
                                  ) : (
                                    filteredTx.map((t: any, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2 font-mono text-slate-800">{t.POSInvoice}</td>
                                        <td className="px-4 py-2 text-slate-400">-</td>
                                        <td className="px-4 py-2">{t.CalendarDate ? t.CalendarDate.split('-').reverse().join('/') : '-'}</td>
                                        <td className="px-4 py-2 text-slate-400">-</td>
                                        <td className="px-4 py-2">{t.BrandName}</td>
                                        <td className="px-4 py-2 text-slate-500">{t.DepartmentName}</td>
                                        <td className="px-4 py-2">{t.CategoryName}</td>
                                        <td className="px-4 py-2">{t.SubcategoryName}</td>
                                        <td className="px-4 py-2 font-mono">{t.StoreCode}</td>
                                        <td className="px-4 py-2">{t.StoreName}</td>
                                        <td className="px-4 py-2 text-center text-slate-800">{t.QtySales}</td>
                                        <td className="px-4 py-2 font-mono">{t.AgentCode || '-'}</td>
                                        <td className="px-4 py-2">{t.ChannelTrx}</td>
                                        <td className="px-4 py-2">{t.CustomerStatus}</td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-800">
                                          {t.Amount?.toLocaleString('id-ID') || 0}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Data Payment Sub-table */}
                          <div className='mb-5'>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Table Data Payment</h4>
                            <div className="border pb-5 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-2.5">POS Invoice</th>
                                    <th className="px-4 py-2.5">Payment Date</th>
                                    <th className="px-4 py-2.5 text-right">Payment Amount</th>
                                    {/* <th className="px-4 py-2.5">Card No</th>
                                    <th className="px-4 py-2.5">Card Name</th>
                                    <th className="px-4 py-2.5">Card Holder</th>
                                    <th className="px-4 py-2.5">Card Type</th>
                                    <th className="px-4 py-2.5">EDC Code</th>
                                    <th className="px-4 py-2.5">EDC Name</th> */}
                                    <th className="px-4 py-2.5">Tender Type</th>
                                    <th className="px-4 py-2.5">Tender Name</th>
                                    <th className="px-4 py-2.5">TRN Type</th>
                                    {/* <th className="px-4 py-2.5">Approval Code</th> */}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-600">
                                  {filteredPay.length === 0 ? (
                                    <tr>
                                      <td colSpan={13} className="px-4 py-8 text-center text-slate-400 italic">No payments found.</td>
                                    </tr>
                                  ) : (
                                    filteredPay.map((p: any, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-2 font-mono text-slate-800">{p.POSInvoice}</td>
                                        <td className="px-4 py-2">{p.PaymentDate ? p.PaymentDate.split('-').reverse().join('/') : '-'}</td>
                                        <td className="px-4 py-2 text-right font-mono text-slate-800">
                                          {p.PaymentAmount?.toLocaleString('id-ID') || 0}
                                        </td>
                                        {/* <td className="px-4 py-2 font-mono">{p.CardNo || '-'}</td> */}
                                        {/* <td className="px-4 py-2">{p.CardName}</td> */}
                                        {/* <td className="px-4 py-2">{p.CardHolder}</td> */}
                                        {/* <td className="px-4 py-2">{p.CardType}</td> */}
                                        {/* <td className="px-4 py-2 font-mono">{p.EDCCode}</td> */}
                                        {/* <td className="px-4 py-2">{p.EDCName}</td> */}
                                        <td className="px-4 py-2 font-mono">{p.TenderType}</td>
                                        <td className="px-4 py-2">{p.TenderName}</td>
                                        <td className="px-4 py-2">{p.TRNTYPE}</td>
                                        {/* <td className="px-4 py-2 font-mono text-slate-500">{p.ApprovalCode || '-'}</td> */}
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {activeDetailTab === 'point' && (
                      <div className="space-y-4">
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3">Balance Point</th>
                                <th className="px-5 py-3">Point</th>
                                <th className="px-5 py-3">Expired Date</th>
                                <th className="px-5 py-3">Redeem Date</th>
                                <th className="px-5 py-3">Flag Movement</th>
                                <th className="px-5 py-3">Article</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-700">
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-5 py-3.5">35</td>
                                <td className="px-5 py-3.5">-5</td>
                                <td className="px-5 py-3.5">12-03-2026</td>
                                <td className="px-5 py-3.5">02-03-2026</td>
                                <td className="px-5 py-3.5">Expired</td>
                                <td className="px-5 py-3.5">-</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-5 py-3.5">40</td>
                                <td className="px-5 py-3.5">+30</td>
                                <td className="px-5 py-3.5">15-02-2026</td>
                                <td className="px-5 py-3.5">07-02-2026</td>
                                <td className="px-5 py-3.5">Redeem</td>
                                <td className="px-5 py-3.5">12453</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="px-5 py-3.5">10</td>
                                <td className="px-5 py-3.5">+10</td>
                                <td className="px-5 py-3.5">12-01-2026</td>
                                <td className="px-5 py-3.5">02-01-2026</td>
                                <td className="px-5 py-3.5">Redeem</td>
                                <td className="px-5 py-3.5">01231</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {activeDetailTab === 'work_order' && (() => {
                      const woDummies = [
                        { woNo: '00596', tglPemasangan: '12-03-2026', alamat: 'Jl Sudirman 17, Jakarta Pusat', hpTeknisi: '082341243112', namaTeknisi: 'Doni', tglFinish: '12-03-2026' },
                        { woNo: '0004', tglPemasangan: '12-03-2026', alamat: 'Jl Sudirman 17, Jakarta Pusat', hpTeknisi: '082341243112', namaTeknisi: 'Angga', tglFinish: '12-03-2026' },
                        { woNo: '004947', tglPemasangan: '12-03-2026', alamat: 'Jl Sudirman 17, Jakarta Pusat', hpTeknisi: '082341243112', namaTeknisi: 'Danang', tglFinish: '12-03-2026' }
                      ];

                      const filteredWo = woDummies.filter(w => {
                        if (woSearchQuery.trim() !== '') {
                          const q = woSearchQuery.toLowerCase();
                          return w.woNo.toLowerCase().includes(q) || w.namaTeknisi.toLowerCase().includes(q) || w.alamat.toLowerCase().includes(q);
                        }
                        return true;
                      });

                      return (
                        <div className="space-y-4">
                          {/* Search box row */}
                          <div className="flex justify-end mb-2 select-none">
                            <div className="relative w-64 text-[10px]">
                              <input
                                type="text"
                                value={woSearchQuery}
                                onChange={(e) => setWoSearchQuery(e.target.value)}
                                placeholder="Search"
                                className="w-full pr-8 pl-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 text-xs shadow-sm"
                              />
                              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  <th className="px-5 py-3">NO WO</th>
                                  <th className="px-5 py-3">Tanggal Pemasangan</th>
                                  <th className="px-5 py-3">Alamat Pemasangan</th>
                                  <th className="px-5 py-3">No HP Teknisi</th>
                                  <th className="px-5 py-3">Nama Teknisi</th>
                                  <th className="px-5 py-3">Tanggal Finish</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-700">
                                {filteredWo.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">No work orders found.</td>
                                  </tr>
                                ) : (
                                  filteredWo.map((w, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-5 py-3.5">{w.woNo}</td>
                                      <td className="px-5 py-3.5">{w.tglPemasangan}</td>
                                      <td className="px-5 py-3.5">{w.alamat}</td>
                                      <td className="px-5 py-3.5">{w.hpTeknisi}</td>
                                      <td className="px-5 py-3.5">{w.namaTeknisi}</td>
                                      <td className="px-5 py-3.5">{w.tglFinish}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}

                    {activeDetailTab === 'delivery_order' && (() => {
                      const doDummies = [
                        { invoiceNo: '00596', tglPengiriman: '12-03-2026', hpDriver: '082341243112', namaDriver: 'Doni', statusPengiriman: 'Pengemasan di gudang' },
                        { invoiceNo: '0004', tglPengiriman: '12-03-2026', hpDriver: '082341243112', namaDriver: 'Angga', statusPengiriman: 'Menuju alamat customer' },
                        { invoiceNo: '004947', tglPengiriman: '12-03-2026', hpDriver: '082341243112', namaDriver: 'Danang', statusPengiriman: 'Diambil oleh driver' }
                      ];

                      const filteredDo = doDummies.filter(d => {
                        if (doSearchQuery.trim() !== '') {
                          const q = doSearchQuery.toLowerCase();
                          return d.invoiceNo.toLowerCase().includes(q) || d.namaDriver.toLowerCase().includes(q) || d.statusPengiriman.toLowerCase().includes(q);
                        }
                        return true;
                      });

                      return (
                        <div className="space-y-4">
                          {/* Search box row */}
                          <div className="flex justify-end mb-2 select-none">
                            <div className="relative w-64 text-[10px]">
                              <input
                                type="text"
                                value={doSearchQuery}
                                onChange={(e) => setDoSearchQuery(e.target.value)}
                                placeholder="Search"
                                className="w-full pr-8 pl-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-semibold text-slate-700 text-xs shadow-sm"
                              />
                              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-slate-400">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  <th className="px-5 py-3">NO Invoice</th>
                                  <th className="px-5 py-3">Tanggal Pengiriman</th>
                                  <th className="px-5 py-3">No HP Driver</th>
                                  <th className="px-5 py-3">Nama Driver</th>
                                  <th className="px-5 py-3">Status Pengiriman</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-[10px] font-semibold text-slate-700">
                                {filteredDo.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400 italic">No delivery orders found.</td>
                                  </tr>
                                ) : (
                                  filteredDo.map((d, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50">
                                      <td className="px-5 py-3.5">{d.invoiceNo}</td>
                                      <td className="px-5 py-3.5">{d.tglPengiriman}</td>
                                      <td className="px-5 py-3.5">{d.hpDriver}</td>
                                      <td className="px-5 py-3.5">{d.namaDriver}</td>
                                      <td className="px-5 py-3.5">{d.statusPengiriman}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
