import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Users, Check, ChevronDown, LogOut } from 'lucide-react';

export default function AccountSwitcher() {
  const { currentUser, accounts, switchAccount, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  const otherAccounts = accounts.filter(a => a.userId !== currentUser.id);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-800/50 transition text-left"
      >
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full bg-gray-700"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
          <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </div>
            </div>

            {/* Current account */}
            <div className="p-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
                <Check className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            {/* Other accounts */}
            {otherAccounts.length > 0 && (
              <div className="p-2 border-t border-gray-800">
                {otherAccounts.map(account => (
                  <button
                    key={account.userId}
                    onClick={() => {
                      switchAccount(account.userId);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-800 transition text-left"
                  >
                    <img src={account.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-300 truncate">{account.name}</p>
                      <p className="text-xs text-gray-500 truncate">{account.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="p-2 border-t border-gray-800">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition text-left"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
