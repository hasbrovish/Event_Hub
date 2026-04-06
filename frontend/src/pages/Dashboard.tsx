import { useRole } from "@/contexts/RoleContext";
import ParticipantHome from "@/pages/home/ParticipantHome";
import OrganizerHome from "@/pages/home/OrganizerHome";
import AdminHome from "@/pages/home/AdminHome";

export default function Dashboard() {
  const { role } = useRole();

  switch (role) {
    case "organizer":
      return <OrganizerHome />;
    case "admin":
      return <AdminHome />;
    default:
      return <ParticipantHome />;
  }
}
