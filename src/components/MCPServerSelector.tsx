// Server selector dropdown component
// src/components/MCPServerSelector.tsx
import { useMCP } from '../contexts/MCPContext';

type MCPServerSelectorProps = {
  value: string;
  onChange: (serverId: string) => void;
  onlyEnabled?: boolean;
};

export default function MCPServerSelector({ value, onChange, onlyEnabled = true }: MCPServerSelectorProps) {
  const { servers, isLoading, error } = useMCP();
  
  const filteredServers = onlyEnabled ? servers.filter(server => server.enabled) : servers;
  
  if (isLoading) {
    return <div className="text-gray-500">Loading servers...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Error loading servers: {error}</div>;
  }
  
  if (filteredServers.length === 0) {
    return <div className="text-gray-500">No MCP servers available</div>;
  }
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full p-2 border rounded"
    >
      <option value="" disabled>Select MCP Server</option>
      {filteredServers.map((server) => (
        <option key={server.id} value={server.id}>
          {server.name}
        </option>
      ))}
    </select>
  );
}