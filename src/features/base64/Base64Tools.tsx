import { TransformationSection } from '@app/components/shared/TransformationSection';

export const Base64Tools = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">Encode</h2>
      <TransformationSection transformCallback={btoa} placeholder="Enter text to encode..." />
    </div>

    <div className="h-px bg-border" />

    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-medium text-muted-foreground">Decode</h2>
      <TransformationSection transformCallback={atob} placeholder="Enter Base64 to decode..." />
    </div>
  </div>
);