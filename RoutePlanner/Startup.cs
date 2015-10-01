using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(RoutePlanner.Startup))]
namespace RoutePlanner
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
