import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, type UserProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    userApi.getProfile(user.userId)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName);
        setCountry(p.country || "");
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user || !displayName.trim()) return;

    setSaving(true);
    try {
      const updated = await userApi.updateProfile(user.userId, {
        displayName: displayName.trim(),
        country: country.trim() || undefined,
        avatarUrl: profile?.avatarUrl,
      });
      setProfile(updated);
      setDisplayName(updated.displayName);
      setCountry(updated.country || "");
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
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : profile ? (
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold">
              {profile.displayName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              ) : (
                <p className="text-lg font-semibold">{profile.displayName}</p>
              )}
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">{profile.role.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Country</p>
              {editing ? (
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Country"
                />
              ) : (
                <p className="font-medium">{profile.country || "-"}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(profile.displayName);
                    setCountry(profile.country || "");
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground">Could not load profile.</p>
      )}
    </div>
  );
}
