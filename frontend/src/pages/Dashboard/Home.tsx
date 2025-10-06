 
import logo from '../../assets/logo.png';

export default function Home() {
  // const stats = [
  //   {
  //     title: 'Total Templates',
  //     value: '24',
  //     change: '+12%',
  //     changeType: 'positive',
  //     icon: FileText,
  //     color: 'bg-blue-500',
  //   },
  //   {
  //     title: 'Uploads Today',
  //     value: '8',
  //     change: '+23%',
  //     changeType: 'positive',
  //     icon: Upload,
  //     color: 'bg-green-500',
  //   },
  //   {
  //     title: 'Active Users',
  //     value: '156',
  //     change: '+5%',
  //     changeType: 'positive',
  //     icon: Users,
  //     color: 'bg-purple-500',
  //   },
  //   {
  //     title: 'Success Rate',
  //     value: '98.5%',
  //     change: '+2.1%',
  //     changeType: 'positive',
  //     icon: TrendingUp,
  //     color: 'bg-orange-500',
  //   },
  // ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome back!</h2>
        <p className="text-gray-600">Here's what's happening with your notary business today.</p>
      </div>

     <center>
      <img src={logo} alt="logo" className="" />
     </center>

 
    </div>
  );
}
