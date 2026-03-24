import { type FC, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Binary, KeyRound, Menu, QrCode } from 'lucide-react';
import { cn } from '@app/lib/utils';
import { Card } from '@app/components/ui/card';
import { Button } from '@app/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@app/components/ui/sheet';

const navItems = [
  { path: '/base64', label: 'Base64', icon: Binary },
  { path: '/jwt', label: 'JWT', icon: KeyRound },
  { path: '/qr', label: 'QR Code', icon: QrCode },
] as const;

type AppLayoutProps = {
  children: ReactNode;
};

const NavLinks: FC<{ pathname: string; onNavigate?: () => void }> = ({ pathname, onNavigate }) => (
  <nav className="flex flex-col gap-0.5">
    {navItems.map(({ path, label, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
          pathname.startsWith(path)
            ? 'bg-accent font-medium text-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        <Icon className="size-4" />
        {label}
      </NavLink>
    ))}
  </nav>
);

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="flex w-full max-w-4xl flex-col overflow-hidden md:h-[600px] md:flex-row">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b p-3 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-4">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left text-base">Navigation</SheetTitle>
              </SheetHeader>
              <NavLinks pathname={pathname} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden w-44 shrink-0 border-r p-4 md:block">
          <NavLinks pathname={pathname} />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </Card>
    </div>
  );
};
