"use client";

import { useState, useEffect } from "react";
import type { AssessmentSubmission, Candidate, CandidateStatus, CandidateType, CandidateSource } from "@/lib/types";
import { CANDIDATE_STATUSES, CANDIDATE_TYPES, CANDIDATE_SOURCES, CandidateUpdateSchema } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, FileText, Share2, Loader2, Trash2, ClipboardList, Video, Upload, CheckCircle2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/app/utils/firebase/firebaseConfig";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSaveChanges: (candidateId: string, updates: Partial<Candidate>) => void;
  onDelete: (candidateId: string, candidateName: string) => void;
  onViewSubmission: (submission: AssessmentSubmission) => void;
}

type CandidateUpdateForm = z.infer<typeof CandidateUpdateSchema>;

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
};

export function CandidateDetailsModal({ isOpen, onClose, candidate, onSaveChanges, onDelete, onViewSubmission }: CandidateDetailsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<CandidateUpdateForm>({
    resolver: zodResolver(CandidateUpdateSchema),
  });

  useEffect(() => {
    if (candidate) {
      form.reset({
        fullName: candidate.fullName || "",
        email: candidate.email || "",
        contactNumber: candidate.contactNumber || "",
        whatsappNumber: candidate.whatsappNumber || "",
        address: candidate.address || "",
        city: candidate.city || "",
        state: candidate.state || "",
        pincode: candidate.pincode || "",
        education: candidate.education || "",
        experience: candidate.experience || candidate.workExperience || "",
        position: candidate.position || "",
        portfolio: candidate.portfolio || "",
        introductionVideoIntern: candidate.introductionVideoIntern || "",
        introductionVideoFulltime: candidate.introductionVideoFulltime || "",
        status: candidate.status ? (toTitleCase(candidate.status as string) as CandidateStatus) : "Applied",
        type: (candidate.type === "intern" ? "internship" : candidate.type === "emp" ? "full-time" : candidate.type) || "full-time",
        comments: candidate.comments || "",
        source: candidate.source || "Website",
        currentCTC: candidate.currentCTC || "",
        expectedCTC: candidate.expectedCTC || "",
        assessmentCompleted: candidate.assessmentCompleted || false,
        assessmentPdfUrl: candidate.assessmentPdfUrl || "",
      });
      setAssessmentFile(null);
    }
  }, [candidate, form]);

  if (!candidate) return null;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/candidate/${candidate.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "A shareable link has been copied to your clipboard.",
    });
  };

  const onSubmit = async (data: CandidateUpdateForm) => {
    setIsProcessing(true);

    const updates: Partial<Candidate> = { ...data };

    if (assessmentFile) {
      try {
        const fileRef = ref(storage, `assessments/${candidate.id}/${Date.now()}-${assessmentFile.name}`);
        const uploadResult = await uploadBytes(fileRef, assessmentFile);
        updates.assessmentPdfUrl = await getDownloadURL(uploadResult.ref);
      } catch (error) {
        console.error("Error uploading assessment PDF:", error);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "There was an error uploading the assessment PDF.",
        });
        setIsProcessing(false);
        return;
      }
    }

    await onSaveChanges(candidate.id, updates);
    setIsProcessing(false);
    // The parent component will handle closing the modal after save.
  };

  const getFormattedDate = (date: any) => {
    if (!date) return "N/A";
    try {
      if (date.toDate) {
        return format(date.toDate(), "MMM d, yyyy");
      }
      return format(new Date(date), "MMM d, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const currentStatus = form.watch("status");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>{candidate.fullName}</DialogTitle>
              <DialogDescription>
                Applied for {candidate.position} on {getFormattedDate(candidate.submittedAt)}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="education"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position Applied For</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Candidate Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CANDIDATE_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("type") === "full-time" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentCTC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current CTC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 5 LPA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedCTC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected CTC</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 8 LPA" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="portfolio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio/Link</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CANDIDATE_SOURCES.filter((s) => s !== "Other").map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
                          </SelectItem>
                        ))}
                        {field.value && !CANDIDATE_SOURCES.includes(field.value as any) && (
                          <SelectItem key={field.value} value={field.value}>
                            {field.value}
                          </SelectItem>
                        )}
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="introductionVideoIntern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Intro Video Link</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      value={field.value || form.getValues("introductionVideoFulltime") || ""}
                      onChange={(e) => {
                        field.onChange(e);
                        form.setValue("introductionVideoFulltime", e.target.value);
                      }}
                      placeholder="https://video-link.com"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("type") === "internship" && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Internship Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-lg border">
                  <FormField
                    control={form.control}
                    name="assessmentCompleted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-background">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) {
                                form.setValue("assessmentPdfUrl", "");
                                setAssessmentFile(null);
                              }
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">
                            Assessment Completed
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Mark if the candidate has finished their task.
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>Assessment PDF</FormLabel>
                    <div className="flex flex-col gap-2">
                      {form.watch("assessmentPdfUrl") && !assessmentFile && (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-700 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">PDF Uploaded</span>
                          <div className="ml-auto flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 text-xs font-semibold text-green-700 hover:bg-green-600 hover:text-white transition-all duration-200 shadow-sm"
                              asChild
                            >
                              <a href={form.watch("assessmentPdfUrl")} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3 mr-1" /> View
                              </a>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 shadow-sm"
                              onClick={() => {
                                form.setValue("assessmentPdfUrl", "");
                                setAssessmentFile(null);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" /> Remove
                            </Button>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.type !== "application/pdf") {
                                toast({
                                  variant: "destructive",
                                  title: "Invalid file type",
                                  description: "Please upload a PDF file.",
                                });
                                return;
                              }
                              setAssessmentFile(file);
                            }
                          }}
                          className="cursor-pointer text-xs"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        {assessmentFile ? `Selected: ${assessmentFile.name}` : "Upload the assessment result in PDF format"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 py-4">
              {candidate.resumeUrl && (
                <Button variant="outline" asChild>
                  <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> View Resume
                  </a>
                </Button>
              )}
              {candidate.portfolio && (candidate.portfolio.toLowerCase() !== "na" && candidate.portfolio.toLowerCase() !== "n/a") && (
                <Button variant="outline" asChild>
                  <a href={candidate.portfolio.startsWith("http") ? candidate.portfolio : `https://${candidate.portfolio}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Portfolio
                  </a>
                </Button>
              )}
              {(candidate.introductionVideoIntern || candidate.introductionVideoFulltime) && (
                <Button variant="outline" asChild>
                  <a href={candidate.introductionVideoIntern || candidate.introductionVideoFulltime} target="_blank" rel="noopener noreferrer">
                    <Video className="mr-2 h-4 w-4" /> View Intro Video
                  </a>
                </Button>
              )}
            </div>

            {candidate.submissions && candidate.submissions.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-base font-semibold">Submissions</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.submissions.map((sub) => (
                    <Button key={sub.id} type="button" variant="secondary" size="sm" onClick={() => onViewSubmission(sub)}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View '{sub.assessmentTitle}'
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CANDIDATE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Comments</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add internal notes about the candidate..." className="mt-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between items-center pt-6">
              <Button type="button" variant="destructive" onClick={() => onDelete(candidate.id, candidate.fullName)} disabled={isProcessing}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Candidate
              </Button>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
