'use client';

'use client';

import React, { useState, useCallback } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider, // Removed duplicate import
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  List,
  PlusCircle,
  Settings,
  Users,
} from 'lucide-react';
import AddDrinkForm from './add-drink-form';
import DrinkList from './drink-list'; // Keep this for rendering the list
import { Toaster } from "@/components/ui/toaster"

// Placeholder components for other sections
const UserList = () => <div className="p-4">User Drink Lists (Coming Soon)</div>;
const SettingsPage = () => <div className="p-4">Settings (Coming Soon)</div>;

export default function AppLayout() {
  const [activeSection, setActiveSection] = useState('my-list');
  const [showAddForm, setShowAddForm] = useState(false);
  // State to force re-render/refetch of DrinkList
  const [listKey, setListKey] = useState(Date.now());

  // Callback to increment the key, forcing DrinkList to re-render/refetch
  const handleDrinkAdded = useCallback(() => {
    console.log("Drink added, updating list key.");
    setListKey(Date.now()); // Update key to trigger refetch in DrinkList
    setActiveSection('my-list'); // Switch back to list view
    setShowAddForm(false); // Hide form
  }, []);

  const renderContent = () => {
    if (showAddForm) {
      // Pass the callback to AddDrinkForm
      return <AddDrinkForm onClose={() => setShowAddForm(false)} onDrinkAdded={handleDrinkAdded} />;
    }
    switch (activeSection) {
      case 'my-list':
        // Pass the key to DrinkList
        return <DrinkList key={listKey} />;
      case 'user-list':
        return <UserList />;
      case 'settings':
        return <SettingsPage />;
      default:
        // Default to DrinkList with the current key
        return <DrinkList key={listKey} />;
    }
  };

  return (
    <SidebarProvider defaultOpen>
        <div className="flex min-h-screen">
        <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader className="items-center justify-between">
            <div className="flex items-center gap-2">
                {/* Placeholder SVG for Sake bottle icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-wine"><path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5V4H7v6a5 5 0 0 0 5 5Z"/></svg>
                <span className="text-lg font-semibold">Drink Log</span>
            </div>
            <SidebarTrigger />
            </SidebarHeader>
            <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => { setActiveSection('my-list'); setShowAddForm(false); }}
                    isActive={activeSection === 'my-list' && !showAddForm}
                    tooltip="My Drink List"
                >
                    <List />
                    <span>My List</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => { setActiveSection('user-list'); setShowAddForm(false); }}
                    isActive={activeSection === 'user-list' && !showAddForm}
                    tooltip="Other Users' Lists"
                     disabled // Disable until implemented
                >
                    <Users />
                    <span>User Lists</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => { setActiveSection('add-drink'); setShowAddForm(true); }}
                    isActive={showAddForm}
                    tooltip="Add New Drink"
                >
                    <PlusCircle />
                    <span>Add Drink</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => { setActiveSection('settings'); setShowAddForm(false); }}
                    isActive={activeSection === 'settings' && !showAddForm}
                    tooltip="Settings"
                     disabled // Disable until implemented
                >
                    <Settings />
                    <span>Settings</span>
                </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset className="flex-1">
            {renderContent()}
            <Toaster />
        </SidebarInset>
        </div>
    </SidebarProvider>

  );
}
