
import { db } from '@/app/utils/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import type { Candidate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Video, Briefcase, GraduationCap, MapPin, Building, Calendar, Mail, Phone, MessageSquare, Info, ClipboardList, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import mmLogo from '../../../../../.idx/mmLogo.png';
import { format } from 'date-fns';

async function getCandidateData(id: string): Promise<Candidate | null> {
  const docRef = doc(db, 'applications', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Candidate;
  } else {
    return null;
  }
}

export default async function SharedCandidatePage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateData(params.id);

  if (!candidate) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Card>
            <CardHeader>
                <CardTitle>Candidate Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p>The candidate profile you are looking for does not exist or has been removed.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  // Normalize type
  const normalizedType = (candidate.type === 'intern' ? 'internship' : candidate.type === 'emp' ? 'full-time' : candidate.type) || 'full-time';
  candidate.type = normalizedType as any;
  
  const displayLocation = candidate.city && candidate.state ? `${candidate.city}, ${candidate.state}` : candidate.location;

  const getFormattedDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      if (date.toDate) {
        return format(date.toDate(), 'MMM d, yyyy');
      }
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const toTitleCase = (str: string | undefined) => {
    if (!str) return 'N/A';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
  };

  const getValidVideoUrl = (intern?: string, fulltime?: string) => {
    const isValid = (url?: string) => {
      if (!url) return false;
      const lower = url.toLowerCase();
      return lower !== "na" && lower !== "n/a" && lower !== "none" && lower !== "";
    };
    if (isValid(intern)) return intern;
    if (isValid(fulltime)) return fulltime;
    return undefined;
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
            <Image height={30} width={150} src={mmLogo} alt="Megamind Careers Logo" />
            <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-bold text-primary">Candidate Profile</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Shared via Megamind Careers</p>
            </div>
        </div>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-background p-4 sm:p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex-grow">
                    <CardTitle className="text-2xl sm:text-3xl font-bold">{candidate.fullName}</CardTitle>
                    <CardDescription className="text-md sm:text-lg text-muted-foreground">{candidate.position}</CardDescription>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="flex items-center gap-2 text-sm">
                           {candidate.type === 'internship' ? <GraduationCap className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                           <span className="capitalize">{candidate.type}</span>
                        </Badge>
                        <Badge variant="secondary" className="flex items-center gap-2 text-sm">
                           <MapPin className="h-4 w-4" />
                           <span>{displayLocation}</span>
                        </Badge>
                         <Badge variant="secondary" className="flex items-center gap-2 text-sm">
                           <Calendar className="h-4 w-4" />
                           <span>Applied on {getFormattedDate(candidate.submittedAt)}</span>
                        </Badge>
                        <Badge variant="default" className="flex items-center gap-2 text-sm">
                           <Info className="h-4 w-4" />
                           <span>Status: {toTitleCase(candidate.status as string)}</span>
                        </Badge>
                    </div>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-base">
                <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground break-all">{candidate.email}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                        <p className="font-medium">Contact Number</p>
                        <p className="text-muted-foreground">{candidate.contactNumber}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                        <p className="font-medium">WhatsApp</p>
                        <p className="text-muted-foreground">{candidate.whatsappNumber}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">{`${candidate.address}, ${candidate.city}, ${candidate.state} ${candidate.pincode}`}</p>
                    </div>
                </div>
            </div>
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2"><Building className="h-5 w-5" /> Education</h3>
              <p className="text-muted-foreground text-base">{candidate.education || 'N/A'}</p>
            </div>
            {(candidate.experience || candidate.workExperience) && (
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Experience
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-base">
                  {candidate.experience || candidate.workExperience}
                </p>
              </div>
            )}
            {candidate.type === 'full-time' && (candidate.currentCTC || candidate.expectedCTC) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 border-t border-border pt-6">
                {candidate.currentCTC && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <p className="font-medium">Current CTC</p>
                      <p className="text-muted-foreground">{candidate.currentCTC}</p>
                    </div>
                  </div>
                )}
                {candidate.expectedCTC && (
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                    <div>
                      <p className="font-medium">Expected CTC</p>
                      <p className="text-muted-foreground">{candidate.expectedCTC}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {candidate.type === 'internship' && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" /> Internship Details
                </h3>
                <div className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 mt-0.5 shrink-0 ${candidate.assessmentCompleted ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div>
                        <p className="font-medium">Assessment Status</p>
                        <p className="text-muted-foreground">{candidate.assessmentCompleted ? 'Completed' : 'Pending'}</p>
                    </div>
                </div>
              </div>
            )}
            {candidate.comments && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Internal Comments</h3>
                <p className="text-muted-foreground whitespace-pre-wrap text-base">{candidate.comments}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-background p-4 sm:p-6 flex flex-wrap items-center gap-4">
              {candidate.portfolio && (candidate.portfolio.toLowerCase() !== "na" && candidate.portfolio.toLowerCase() !== "n/a") && (
                <Button variant="outline" asChild>
                  <a href={candidate.portfolio.startsWith("http") ? candidate.portfolio : `https://${candidate.portfolio}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> View Portfolio
                  </a>
                </Button>
              )}
              {candidate.resumeUrl && (
                <Button variant="outline" asChild>
                  <a href={candidate.resumeUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> View Resume
                  </a>
                </Button>
              )}
              {(() => {
                const videoUrl = getValidVideoUrl(candidate.introductionVideoIntern, candidate.introductionVideoFulltime);
                if (!videoUrl) return null;
                return (
                  <Button variant="outline" asChild>
                    <a href={videoUrl.startsWith("http") ? videoUrl : `https://${videoUrl}`} target="_blank" rel="noopener noreferrer">
                      <Video className="mr-2 h-4 w-4" /> View Intro Video
                    </a>
                  </Button>
                );
              })()}
              {candidate.type === 'internship' && candidate.assessmentPdfUrl && (
                <Button variant="outline" asChild>
                  <a href={candidate.assessmentPdfUrl} target="_blank" rel="noopener noreferrer">
                    <ClipboardList className="mr-2 h-4 w-4" /> View Assessment
                  </a>
                </Button>
              )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
