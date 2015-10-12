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
        public ActionResult Index()
        {
            //MailMessage mail = new MailMessage();
            //SmtpClient SmtpServer = new SmtpClient("smtp.gmail.com");
            //mail.From = new MailAddress("alexjwilliams57@gmail.com");
            //mail.To.Add("alexwilliams57@hotmail.com");
            //mail.Subject = "Test Email";
            //mail.Body += " <html>";
            //mail.Body += "<body>";
            //mail.Body += "<table>";
            //mail.Body += "<tr>";
            //mail.Body += "<td>User Name : </td><td> HAi </td>";
            //mail.Body += "</tr>";

            //mail.Body += "<tr>";
            //mail.Body += "<td>Password : </td><td>aaaaaaaaaa</td>";
            //mail.Body += "</tr>";
            //mail.Body += "</table>";
            //mail.Body += "</body>";
            //mail.Body += "</html>";
            //mail.IsBodyHtml = true;
            //SmtpServer.Port = 587;
            //SmtpServer.Credentials = new System.Net.NetworkCredential("alexjwilliams57@gmail.com", "eae.b-hJ");
            //SmtpServer.EnableSsl = true;
            //SmtpServer.Send(mail);

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
    }
}