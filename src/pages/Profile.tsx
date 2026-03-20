import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, type UserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    userApi.getProfile(user.userId)
      .then((p) => { setProfile(p); setDisplayName(p.displayName); })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      const updated = await userApi.updateProfile(user.userId, { displayName: displayName.trim() });
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container-page py-8 max-w-lg mx-auto space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <User className="w-6 h-6" /> Profile
      </h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : profile ? (
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold">
              {profile.displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              {editing ? (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="font-semibold text-lg">{profile.displayName}</p>
              )}
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{profile.role.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Country</p>
              <p className="font-medium">{profile.country || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} size="sm">{saving ? "Saving..." : "Save"}</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDisplayName(profile.displayName); }}>Cancel</Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit profile</Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Could not load profile.</p>
      )}
    </div>
  );
}
