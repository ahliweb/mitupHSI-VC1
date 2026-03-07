import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/dashboard/media/FileUploader';
import { FolderClosed, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';

function FilesHeaderActions({
  showTrash,
  selectedCategoryName,
  handleSync,
  syncing,
  navigate,
  basePath,
  isUploadOpen,
  setIsUploadOpen,
  handleUpload,
  uploading,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
        {selectedCategoryName || 'All Files'}
      </span>

      {!showTrash && (
        <Button
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          title="Sync files from Storage Bucket if missing in DB"
          className="h-10 rounded-xl border-border/70 bg-background/80 px-3 text-muted-foreground shadow-sm hover:bg-accent/70 hover:text-foreground"
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', syncing && 'animate-spin')} />
          {syncing ? 'Syncing...' : 'Sync Storage'}
        </Button>
      )}

      <Button
        variant="outline"
        onClick={() => {
          navigate(showTrash ? basePath : `${basePath}/trash`);
        }}
        className={cn(
          'h-10 rounded-xl border-border/70 px-3 shadow-sm',
          showTrash
            ? 'bg-primary text-primary-foreground hover:opacity-95'
            : 'bg-background/80 text-muted-foreground hover:bg-accent/70 hover:text-foreground'
        )}
      >
        {showTrash ? (
          <>
            <FolderClosed className="mr-2 h-4 w-4" />
            Back to Library
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
            Trash Bin
          </>
        )}
      </Button>

      {!showTrash && (
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 rounded-xl bg-primary px-4 text-primary-foreground shadow-sm hover:opacity-95">
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl border-border/60 bg-background/95">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Drag and drop files here to upload directly to your media library. Supported formats: JPG, PNG, WEBP, PDF.
                {selectedCategoryName && (
                  <span className="mt-2 block font-medium text-primary">
                    Uploading to category: {selectedCategoryName}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <FileUploader onUpload={handleUpload} uploading={uploading} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default FilesHeaderActions;
