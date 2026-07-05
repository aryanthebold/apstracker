import UploadForm from '@/components/UploadForm';
import { UploadCloud } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

export default function UploadPage() {
  return (
    <div className="flex-1 pt-8 pb-28 px-4 md:px-8 max-w-3xl mx-auto w-full">
      {/* Page Header */}
      <ScrollReveal direction="down" duration={500}>
        <div className="page-header mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent-primary/10 flex items-center justify-center">
              <UploadCloud className="h-4 w-4 text-accent-primary" />
            </div>
            <h1 className="font-bold text-3xl md:text-4xl tracking-tight">
              Upload <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Result PDF</span>
            </h1>
          </div>
          <p className="text-[13px] text-text-secondary pl-11">
            Upload your official AKTU marksheet PDF to be included in the leaderboard.
          </p>
        </div>
      </ScrollReveal>
      
      <ScrollReveal delay={100} direction="up">
        <UploadForm />
      </ScrollReveal>
    </div>
  );
}
