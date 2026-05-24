import { Monitor, MonitorSmartphone, Smartphone } from "lucide-react";
import { Card } from "../../../components/Card";

export function ActiveSessionsPanel() {
  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
          <MonitorSmartphone size={16} className="text-[#065f46]" /> Active Sessions
        </h3>
        <button className="text-tanaw-red text-[10px] font-bold hover:text-red-700 hover:underline sm:text-xs">Sign Out of All Other Devices</button>
      </div>
      <div className="overflow-x-auto rounded-sm border border-gray-200">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
            <tr>
              <th className="border-b border-gray-200 p-3">Device</th>
              <th className="border-b border-gray-200 p-3">Location</th>
              <th className="border-b border-gray-200 p-3">Last Active</th>
              <th className="border-b border-gray-200 p-3">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="flex items-center gap-2 p-3 font-semibold text-[#111827]">
                <Monitor size={14} className="text-[#065f46]" /> Mac Studio (Current)
              </td>
              <td className="p-3 font-medium text-gray-600">San Pedro, PH</td>
              <td className="p-3 text-xs font-bold text-green-600">Active Now</td>
              <td className="p-3 font-mono text-xs text-gray-500">192.168.1.45</td>
            </tr>
            <tr>
              <td className="flex items-center gap-2 p-3 font-semibold text-[#111827]">
                <Smartphone size={14} className="text-gray-400" /> iPhone 14 Pro
              </td>
              <td className="p-3 font-medium text-gray-600">Makati, PH</td>
              <td className="p-3 text-xs font-medium text-gray-500">2 hours ago</td>
              <td className="p-3 font-mono text-xs text-gray-500">112.198.100.22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
