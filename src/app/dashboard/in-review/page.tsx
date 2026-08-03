'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2, X } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/app/utils/firebase/firebaseConfig';
import { CANDIDATE_STATUSES, CANDIDATE_SOURCES, type Candidate } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import Link from 'next/link';

export default function InReviewCandidatesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filters state
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filteredCandidates = candidates.filter(candidate => {
    const matchesName = !nameFilter || candidate.fullName.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesPosition = !positionFilter || (candidate.position || '').toLowerCase().includes(positionFilter.toLowerCase());
    const matchesExperience = !experienceFilter || (candidate.experience || '').toLowerCase().includes(experienceFilter.toLowerCase());
    const matchesSource = sourceFilter === 'all' || candidate.source === sourceFilter;
    
    return matchesName && matchesPosition && matchesExperience && matchesSource;
  });

  const isFiltered = nameFilter !== '' || positionFilter !== '' || experienceFilter !== '' || sourceFilter !== 'all';
  const resetFilters = () => {
    setNameFilter('');
    setPositionFilter('');
    setExperienceFilter('');
    setSourceFilter('all');
  };

  const handleStatusUpdate = async (candidateId: string, newStatus: string) => {
    try {
      const candidateRef = doc(db, 'applications', candidateId);
      await updateDoc(candidateRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
      return;
    }
    
    if (user) {
      const q = query(
        collection(db, 'applications'),
        where('status', 'in', ['In Review', 'in review', 'In review'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
        
        // Filter for Graphic Designers and Video Editors (including interns)
        const filteredData = data.filter(candidate => {
          const pos = (candidate.position || '').toLowerCase();
          return pos.includes('graphic') || pos.includes('video');
        });

        setCandidates(filteredData);
        setLoadingData(false);
      });

      return () => unsubscribe();
    }
  }, [user, authLoading, router]);

  if (authLoading || loadingData || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>In Review Candidates</CardTitle>
          <CardDescription>
            A list of all candidates currently in the review process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Input
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Input
              placeholder="Filter by position..."
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Input
              placeholder="Filter by experience..."
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="h-8 w-[150px] lg:w-[250px]"
            />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 w-[150px] lg:w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {CANDIDATE_SOURCES.map(source => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-8 px-2 lg:px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Update Status</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Portfolio Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{candidate.fullName}</TableCell>
                      <TableCell>{candidate.position}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{candidate.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={candidate.status}
                          onValueChange={(value) => handleStatusUpdate(candidate.id, value)}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {CANDIDATE_STATUSES.map((statusOption) => (
                              <SelectItem key={statusOption} value={statusOption}>
                                {statusOption}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{candidate.experience || 'N/A'}</TableCell>
                      <TableCell>{candidate.source || 'N/A'}</TableCell>
                      <TableCell>
                        {candidate.portfolio ? (
                          <Link 
                            href={candidate.portfolio} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Portfolio
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
