import { IssueList } from "@/components/issue-list";

export function App() {
  return (
    <div className="min-h-svh bg-background p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Issue Tracker</h1>
        <IssueList />
      </div>
    </div>
  );
}

export default App;
