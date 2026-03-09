import { Zap, Briefcase, Map, Video, FileQuestion, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Header = () => {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <div className="relative bg-gradient-to-br from-primary to-primary/70 p-2 rounded-xl">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              CareerAI
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Jobs
            </Button>
            <Button variant="ghost" className="gap-2">
              <Map className="h-4 w-4" />
              Roadmap
            </Button>
            <Button variant="ghost" className="gap-2">
              <Video className="h-4 w-4" />
              Interview
            </Button>
            <Button variant="ghost" className="gap-2">
              <FileQuestion className="h-4 w-4" />
              Quiz
            </Button>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  L
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium">Loading...</p>
                <p className="text-xs text-muted-foreground">View Profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
