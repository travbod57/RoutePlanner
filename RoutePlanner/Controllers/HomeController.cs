using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Web;
using System.Web.Mvc;

namespace RoutePlanner.Controllers
{
    public class HomeController : Controller
    {
        //public ActionResult Index()
        //{
        //    return View();
        //}

        public ActionResult Index(int? tripId)
        {
            return View();
        }

        public ActionResult MyTrips()
        {

            return View();
        }

        public ActionResult AngularDatepicker()
        {

            return View();
        }

        public ActionResult BootstrapAngularDatepicker()
        {

            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }

        public ActionResult Test()
        {

            return View();
        }

        public ActionResult AngularMaps()
        {

            return View();
        }

        public JsonResult MockSendEmail()
        {

            return Json(true, JsonRequestBehavior.AllowGet);
        }
    }
}