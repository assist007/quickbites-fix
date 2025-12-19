import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ShoppingBag, Sun, Moon, User, LogOut, Package, Settings, Shield, Users, MessageSquare, CreditCard, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useEmployeeCheck } from "@/hooks/useRoleCheck";
import { NotificationBell } from "@/components/NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  setShowLogin: (show: boolean) => void;
}

const Navbar = ({ setShowLogin }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { getTotalCartItems } = useStore();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();
  const { hasRole: isEmployee } = useEmployeeCheck();
  const navigate = useNavigate();
  const location = useLocation();
  const cartCount = getTotalCartItems();

  const navLinks = [
    { name: "Home", href: "/", isRoute: true },
    { name: "Menu", href: "#menu", isRoute: false },
    { name: "How it Works", href: "#how-it-works", isRoute: false },
    { name: "About", href: "#about", isRoute: false },
  ];

  const handleNavClick = (href: string, isRoute: boolean) => {
    setIsOpen(false);
    if (isRoute) {
      if (location.pathname === href) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (href.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(href);
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <span className="text-xl">🍔</span>
            </div>
            <span className="text-xl md:text-2xl font-bold">
              Quick<span className="text-primary">Bites</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => handleNavClick(link.href, link.isRoute)}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href, link.isRoute);
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {user && <NotificationBell />}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gradient-hero text-primary-foreground">
                    <User className="h-4 w-4 mr-2" />
                    {user.user_metadata?.full_name?.split(" ")[0] || "Account"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-muted-foreground text-sm">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}> 
                    <Settings className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/orders")}> 
                    <Package className="h-4 w-4 mr-2" />
                    Order History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")}> 
                    <MessageSquare className="h-4 w-4 mr-2" />
                    My Messages
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/products")}>
                        <Package className="h-4 w-4 mr-2" />
                        Product Management
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/users")}>
                        <UserCog className="h-4 w-4 mr-2" />
                        User Management
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/messages")}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Received Messages
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/admin/payments")}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Payment Verification
                      </DropdownMenuItem>
                    </>
                  )}
                  {isEmployee && (
                    <DropdownMenuItem onClick={() => navigate("/employee")}>
                      <Users className="h-4 w-4 mr-2" />
                      Employee Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                className="gradient-hero text-primary-foreground"
                onClick={() => setShowLogin(true)}
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && <NotificationBell />}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
            <button
              className="p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href, link.isRoute);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  >
                    {link.name}
                  </a>
                )
              )}

              {user && (
                <div className="pt-2 border-t border-border flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground py-2">
                    Dashboard
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/profile");
                    }}
                    className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  >
                    Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/orders");
                    }}
                    className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  >
                    Order History
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/messages");
                    }}
                    className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  >
                    My Messages
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/admin");
                        }}
                        className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      >
                        Admin Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/admin/products");
                        }}
                        className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      >
                        Product Management
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/admin/users");
                        }}
                        className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      >
                        User Management
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/admin/messages");
                        }}
                        className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      >
                        Received Messages
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/admin/payments");
                        }}
                        className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                      >
                        Payment Verification
                      </button>
                    </>
                  )}

                  {isEmployee && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/employee");
                      }}
                      className="w-full text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                    >
                      Employee Dashboard
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t border-border sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 mr-2" /> Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 mr-2" /> Dark
                    </>
                  )}
                </Button>
                {user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setIsOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <Button
                    className="gradient-hero text-primary-foreground w-full sm:w-auto"
                    size="sm"
                    onClick={() => {
                      setIsOpen(false);
                      setShowLogin(true);
                    }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
