import {
  Calendar,
  Home,
  Plus,
  Settings,
  Shield,
  Users,
  Mic,
  BarChart3,
  Bell,
  ChevronDown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useRole, UserRole } from "@/contexts/RoleContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roleLabels: Record<UserRole, string> = {
  audience: "Audience",
  speaker: "Speaker",
  organizer: "Organizer",
  admin: "App Admin",
};

const roleIcons: Record<UserRole, typeof Users> = {
  audience: Users,
  speaker: Mic,
  organizer: Shield,
  admin: BarChart3,
};

const audienceItems = [
  { title: "Discover Events", url: "/", icon: Home },
  { title: "My Calendar", url: "/calendar", icon: Calendar },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Preferences", url: "/preferences", icon: Settings },
];

const speakerItems = [
  { title: "Discover Events", url: "/", icon: Home },
  { title: "Propose Event", url: "/create-event", icon: Plus },
  { title: "My Sessions", url: "/my-sessions", icon: Mic },
  { title: "My Calendar", url: "/calendar", icon: Calendar },
];

const organizerItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Manage Events", url: "/manage-events", icon: Settings },
  { title: "Campaigns", url: "/campaigns", icon: BarChart3 },
  { title: "My Calendar", url: "/calendar", icon: Calendar },
];

const adminItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Access Matrix", url: "/admin/access", icon: Shield },
  { title: "All Events", url: "/manage-events", icon: Calendar },
  { title: "System Logs", url: "/admin/logs", icon: BarChart3 },
  { title: "App Config", url: "/admin/config", icon: Settings },
];

const roleMenuItems: Record<UserRole, typeof audienceItems> = {
  audience: audienceItems,
  speaker: speakerItems,
  organizer: organizerItems,
  admin: adminItems,
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { role, setRole } = useRole();
  const items = roleMenuItems[role];
  const RoleIcon = roleIcons[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-sidebar-primary">EventHub</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center mb-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground text-sm">
              <RoleIcon className="h-4 w-4 text-sidebar-primary" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{roleLabels[role]}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            {(Object.keys(roleLabels) as UserRole[]).map((r) => {
              const Icon = roleIcons[r];
              return (
                <DropdownMenuItem key={r} onClick={() => setRole(r)} className={role === r ? "bg-accent" : ""}>
                  <Icon className="mr-2 h-4 w-4" />
                  {roleLabels[r]}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
