import React, { createContext, useState, ReactNode, useContext } from 'react';

const AppContext = createContext<any>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [contacts, setContacts] = useState([
    { id: '1', initials: 'AK', name: 'Ahmed Kofi', number: '+234 803 123 4567', location: 'Lagos, Nigeria' },
    { id: '2', initials: 'MN', name: 'Maria Nkomo', number: '+27 82 456 7890', location: 'Cape Town, SA' },
    { id: '3', initials: 'JD', name: 'John Doe', number: '+254 701 234 567', location: 'Nairobi, Kenya' },
  ]);

  const [recentCalls, setRecentCalls] = useState([
    { id: '1', name: 'Ahmed Kofi', type: 'Outgoing', location: 'Lagos, Nigeria', time: '2 min ago', saved: '$2.40' },
    { id: '2', name: 'Maria Nkomo', type: 'Incoming', location: 'Cape Town, SA', time: '1 hour ago' },
    { id: '3', name: 'John Doe', type: 'Outgoing', location: 'Nairobi, Kenya', time: '3 hours ago', saved: '$1.80' },
  ]);

  return (
    <AppContext.Provider value={{ contacts, setContacts, recentCalls, setRecentCalls }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);