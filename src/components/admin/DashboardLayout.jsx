'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavLink from '@/components/NavLink';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

import { 
    LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, 
    FileText, Users, Building, GitBranch, BarChart2, MessageSquare, 
    Trash2, FolderGit2, Shield, CheckSquare, ListTodo, Wallet,
    PanelLeftClose, PanelRightClose, Sun, Moon, Award, Newspaper
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { logout, profile, permissions, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const navLinks = [
        { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard, pageName: 'Overview' },
        { href: '/admin/reports', label: 'Reports', icon: FileText, pageName: 'Reports' },
        { href: '/admin/bounties', label: 'Bounties', icon: Award, pageName: 'Bounties' },
        { href: '/admin/customer-feedback', label: 'Customer Feedback', icon: MessageSquare, pageName: 'Customer Feedback' },
        { href: '/admin/news-editor', label: 'News Editor', icon: Newspaper, pageName: 'News Editor' },
        { href: '/admin/triage', label: 'Triage', icon: FolderGit2, pageName: 'Triage' },
        { href: '/admin/user-management', label: 'User Management', icon: Users, pageName: 'User Management' },
        { href: '/admin/organizations-management', label: 'Organizations', icon: Building, pageName: 'Organizations' },
        { href: '/admin/unmatched-organizations', label: 'Unmatched Orgs', icon: GitBranch, pageName: 'Unmatched Organization' },
        { href: '/admin/reward', label: 'Reward', icon: Wallet, pageName: 'Reward' },
        { href: '/admin/billing', label: 'Billing', icon: BarChart2, pageName: 'Billing' },
        { href: '/admin/plan-management', label: 'Plan Management', icon: ListTodo, pageName: 'Plan Management' },
        { href: '/admin/plan-features', label: 'Plan Features', icon: CheckSquare, pageName: 'Plan Features' },
        { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldCheck, pageName: 'Audit Logs' },
        { href: '/admin/trashed-reports', label: 'Trashed Report', icon: Trash2, pageName: 'Trashed Report' },
        { href: '/admin/settings', label: 'Settings', icon: Settings, pageName: 'Settings' },
    ];
    
    const isSuperAdmin = profile?.user_type === 'super_admin';
    const canSeeTrashed = isSuperAdmin || profile?.user_type === 'executive_admin';
    
    // Show filtered links immediately - if we don't have profile data yet, show basic links
    const visibleNavLinks = profile ? navLinks.filter(link => {
        if (link.pageName === 'Trashed Report') return canSeeTrashed;
        return isSuperAdmin || permissions[link.pageName];
    }) : [
        // Show basic navigation links while profile loads
        { href: '/admin/overview', label: 'Overview', icon: LayoutDashboard, pageName: 'Overview' },
        { href: '/admin/reports', label: 'Reports', icon: FileText, pageName: 'Reports' },
        { href: '/admin/bounties', label: 'Bounties', icon: Award, pageName: 'Bounties' },
        { href: '/admin/settings', label: 'Settings', icon: Settings, pageName: 'Settings' },
    ];

    const sideNav = (isMinimized) => (
        <div className="flex flex-col h-full">
            <nav className="flex-1 text-sm font-medium">
                {visibleNavLinks.map((link) => (
                    <NavLink
                        key={link.href}
                        to={link.href}
                        className={({ isActive }) =>
                            cn('flex items-center gap-3 px-4 py-3 transition-all',
                             isMinimized ? 'justify-center' : 'justify-start',
                             isActive
                                ? 'text-primary bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground'
                            )
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <link.icon className="h-5 w-5" />
                        {!isMinimized && link.label}
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto p-4 border-t">
                 <Button variant="ghost" className={cn("w-full flex items-center gap-3 px-1", isMinimized ? "justify-center" : "justify-start")} onClick={handleLogout}>
                   <LogOut className="h-5 w-5"/>
                   {!isMinimized && <span>Logout</span>}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-background">
            <div className="hidden md:flex flex-col fixed left-0 top-0 h-full border-r bg-background z-40 transition-all duration-300" style={{ width: isSidebarOpen ? '280px' : '80px' }}>
                <div className="flex h-16 items-center border-b px-4 lg:px-6 shrink-0">
                    <Link href="/" className="flex items-center gap-2 font-semibold">
                        <Shield className="h-6 w-6" />
                        {!isSidebarOpen && <span className="sr-only">Whistleblower</span>}
                        {isSidebarOpen && <span>Whistleblower</span>}
                    </Link>
                </div>
                {sideNav(!isSidebarOpen)}
            </div>
            <div className={cn("flex flex-col transition-all duration-300", isSidebarOpen ? "md:ml-[280px]" : "md:ml-[80px]")}>
                <header className="flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6 sticky top-0 z-30">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="flex flex-col p-0">
                            <div className="flex h-16 items-center border-b px-6">
                                <Link href="/" className="flex items-center gap-2 font-semibold">
                                    <Shield className="h-6 w-6" />
                                    <span>Whistleblower</span>
                                </Link>
                            </div>
                            {sideNav(false)}
                        </SheetContent>
                    </Sheet>

                    <Button variant="outline" size="icon" className="hidden md:flex" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelRightClose className="h-5 w-5" />}
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                    
                    <div className="flex-1" />

                    <div className="flex items-center gap-4">
                        <div className="hidden md:block text-sm md:text-base font-medium text-muted-foreground text-right">
                           Welcome, {profile?.name || 'Admin'}
                           {profile?.organizationName && ` of ${profile.organizationName}`}
                        </div>
                        <Button variant="outline" size="icon" onClick={toggleTheme}>
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/20">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;