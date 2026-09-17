import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Filter,
  Loader2,
  MapPin,
  Phone,
  PhoneCall,
  Plus,
  Search,
  Upload,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { IntentScore } from "@/components/common/IntentScore";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadsApi, telephonyApi, type LeadDTO } from "@/lib/api";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

export const Route = createFileRoute("/leads/")({
  head: () => ({
    meta: [
      { title: "Leads CRM — Indianvoice.ai" },
      {
        name: "description",
        content:
          "Manage your prospect database: view intent scores, qualification status, pain points and call history for every lead.",
      },
    ],
  }),
  component: LeadsPage,
});

const STATUS_OPTIONS = [
  "all",
  "New",
  "Contacted",
  "Interested",
  "Qualified",
  "Meeting",
  "Not Interested",
  "Do Not Contact",
] as const;

type StatusOption = (typeof STATUS_OPTIONS)[number];

function LeadsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusOption>("all");
  const [isImporting, setIsImporting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [callingLeadId, setCallingLeadId] = useState<string | null>(null);

  // New lead form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newIndustry, setNewIndustry] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", { search: debouncedSearch, status: statusFilter }],
    queryFn: () => {
      const params: { search?: string; status?: string; limit: number } = { limit: 200 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;
      return leadsApi.list(params);
    },
    staleTime: 15_000,
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: Partial<LeadDTO>) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead added successfully!");
      setIsAddOpen(false);
      setNewName("");
      setNewPhone("");
      setNewCompany("");
      setNewEmail("");
      setNewIndustry("");
    },
    onError: (err: any) => {
      toast.error("Failed to add lead", { description: err.message });
    },
  });

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const res = await leadsApi.importCsv(file);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success(`Successfully imported ${res.imported} leads!`, {
        description: res.errors.length > 0 ? `${res.errors.length} rows had errors and were skipped.` : undefined,
      });
    } catch (err: any) {
      toast.error("Failed to import CSV", { description: err.message });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleExportCsv() {
    if (leads.length === 0) {
      toast.info("No leads to export.");
      return;
    }
    const headers = ["name", "phone", "company", "title", "email", "status", "intent_score"];
    const rows = leads.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.company || ""}"`,
      `"${l.title || ""}"`,
      `"${l.email || ""}"`,
      `"${l.status}"`,
      l.intent_score,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported to CSV!");
  }

  async function handleCallLead(lead: LeadDTO) {
    if (!lead.phone) {
      toast.error("No phone number on record for this lead.");
      return;
    }

    setCallingLeadId(lead.id);
    try {
      const res = await telephonyApi.outboundCall(lead.phone, lead.id, lead.agent_id ?? undefined);
      toast.success(`Outbound call placed to ${lead.name}`, {
        description: `Via LiveKit · Room active · ID: ${res.call_sid?.slice(0, 12) ?? res.call_id?.slice(0, 12) ?? "N/A"}`,
      });
    } catch (err: any) {
      const msg = err.message || "";
      const status = err.status ?? err.statusCode ?? 0;
      if (status === 503 || msg.includes("not configured")) {
        toast.info(`LiveKit telephony not configured. Phone: ${lead.phone}`, {
          description: "Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_PHONE_NUMBER in .env.",
        });
      } else {
        toast.error(`Call failed: ${lead.phone}`, { description: msg });
      }
    } finally {
      setCallingLeadId(null);
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      <PageHeader
        title="Leads CRM"
        subtitle={`${leads.length.toLocaleString()} contacts found`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
            >
              {isImporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {isImporting ? "Importing…" : "Import CSV"}
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-ai hover:bg-ai-dark gap-1.5 text-white">
                  <Plus className="size-4" /> Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Customer Phone Number</DialogTitle>
                  <DialogDescription>
                    Add a prospect to your list. The AI sales agent will dial this number during outbound campaigns.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newName.trim() || !newPhone.trim()) {
                      toast.error("Name and Phone Number are required.");
                      return;
                    }
                    createLeadMutation.mutate({
                      name: newName.trim(),
                      phone: newPhone.trim(),
                      company: newCompany.trim(),
                      email: newEmail.trim(),
                      industry: newIndustry.trim(),
                    });
                  }}
                  className="space-y-3 py-2"
                >
                  <div>
                    <Label htmlFor="lead-name">Contact Name *</Label>
                    <Input
                      id="lead-name"
                      placeholder="e.g. John Miller"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-phone">Phone Number (with Country Code) *</Label>
                    <Input
                      id="lead-phone"
                      placeholder="e.g. +1 415 555 2671"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-company">Company</Label>
                    <Input
                      id="lead-company"
                      placeholder="e.g. Acme Health Corp"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-email">Email</Label>
                    <Input
                      id="lead-email"
                      type="email"
                      placeholder="e.g. john@acme.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead-industry">Industry</Label>
                    <Input
                      id="lead-industry"
                      placeholder="e.g. Healthcare / SaaS / Real Estate"
                      value={newIndustry}
                      onChange={(e) => setNewIndustry(e.target.value)}
                    />
                  </div>
                  <DialogFooter className="pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createLeadMutation.isPending}
                      className="bg-ai hover:bg-ai-dark text-white"
                    >
                      {createLeadMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Save Lead"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="leads-search"
            placeholder="Search by name, company, email…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusOption)}
        >
          <SelectTrigger className="w-44">
            <Filter className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {leads.length} leads
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-ai" />
          </div>
        ) : leads.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Users}
              title="No leads found"
              description="Upload a CSV with phone numbers or click '+ Add Lead' to add your prospects."
              action={
                <Button
                  className="bg-ai hover:bg-ai-dark text-white gap-1.5"
                  onClick={() => setIsAddOpen(true)}
                >
                  <Plus className="size-4" /> Add your first lead
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs text-muted-foreground uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-medium">Contact</th>
                  <th className="px-4 py-3 text-left font-medium">Phone Number</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Intent</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Industry</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="transition-colors hover:bg-surface-muted group"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: lead.id }}
                        className="flex items-start gap-3 group-hover:text-ai"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ai-soft text-xs font-bold text-ai">
                          {lead.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-foreground group-hover:text-ai transition-colors">
                            {lead.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lead.title}{lead.title && lead.company ? " · " : ""}{lead.company}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      {lead.phone ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-2 py-1 font-medium">
                          <Phone className="size-3 text-muted-foreground" />
                          {lead.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">No number</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3">
                      <IntentScore score={lead.intent_score} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        {lead.location || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted-foreground">
                      {lead.industry || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={callingLeadId === lead.id || !lead.phone}
                        onClick={() => handleCallLead(lead)}
                        className="gap-1.5 text-xs hover:bg-ai hover:text-white transition-colors"
                      >
                        {callingLeadId === lead.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <PhoneCall className="size-3.5 text-emerald-500" />
                        )}
                        Call
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
