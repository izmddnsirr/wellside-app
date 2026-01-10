import { AdminShell } from "../components/admin-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Page() {
  return (
    <AdminShell
      title="Reports"
      description="View revenue, staffing, and service insights."
    >
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="daily">
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { label: "Bookings", value: "28" },
                { label: "Total sales", value: "RM 2,140" },
                { label: "Avg ticket", value: "RM 76" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Daily service mix</CardTitle>
                <CardDescription>Breakdown by service category.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { service: "Haircut", bookings: "14", revenue: "RM 980" },
                      { service: "Beard trim", bookings: "6", revenue: "RM 270" },
                      { service: "Hair + wash", bookings: "5", revenue: "RM 420" },
                      { service: "Product add-ons", bookings: "3", revenue: "RM 470" },
                    ].map((row) => (
                      <TableRow key={row.service}>
                        <TableCell className="font-medium">{row.service}</TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell className="text-right">{row.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { label: "Bookings", value: "182" },
                { label: "Total sales", value: "RM 14,860" },
                { label: "Avg ticket", value: "RM 82" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Weekly team performance</CardTitle>
                <CardDescription>Top barbers by revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barber</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: "Haziq", bookings: "42", revenue: "RM 3,620" },
                      { name: "Safi", bookings: "38", revenue: "RM 3,140" },
                      { name: "Rizal", bookings: "35", revenue: "RM 2,980" },
                      { name: "Ikmal", bookings: "31", revenue: "RM 2,420" },
                    ].map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell className="text-right">{row.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { label: "Bookings", value: "742" },
                { label: "Total sales", value: "RM 58,300" },
                { label: "Avg ticket", value: "RM 78" },
              ].map((stat) => (
                <Card key={stat.label}>
                  <CardHeader>
                    <CardDescription>{stat.label}</CardDescription>
                    <CardTitle className="text-2xl">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Monthly trends</CardTitle>
                <CardDescription>Sales by week in the month.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Bookings</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { week: "Week 1", bookings: "176", revenue: "RM 13,900" },
                      { week: "Week 2", bookings: "188", revenue: "RM 14,840" },
                      { week: "Week 3", bookings: "192", revenue: "RM 15,210" },
                      { week: "Week 4", bookings: "186", revenue: "RM 14,350" },
                    ].map((row) => (
                      <TableRow key={row.week}>
                        <TableCell className="font-medium">{row.week}</TableCell>
                        <TableCell>{row.bookings}</TableCell>
                        <TableCell className="text-right">{row.revenue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminShell>
  );
}
