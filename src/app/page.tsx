import { Lab } from "@/components/lab/Lab";
import { LabErrorBoundary } from "@/components/lab/LabErrorBoundary";

export default function Home() { return <LabErrorBoundary><Lab /></LabErrorBoundary>; }
