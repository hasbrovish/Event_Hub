import { useRole } from "@/contexts/RoleContext";
import AudienceHome from "@/pages/home/AudienceHome";
import SpeakerHome from "@/pages/home/SpeakerHome";
import OrganizerHome from "@/pages/home/OrganizerHome";
import AdminHome from "@/pages/home/AdminHome";

export default function Dashboard() {
  const { role } = useRole();

  switch (role) {
    case "speaker":
      return <SpeakerHome />;
    case "organizer":
      return <OrganizerHome />;
    case "admin":
      return <AdminHome />;
    default:
      return <AudienceHome />;
  }
}
