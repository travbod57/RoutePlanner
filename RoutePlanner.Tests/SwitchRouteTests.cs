using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System.Collections.Generic;

namespace RoutePlanner.Tests
{
    [TestClass]
    public class SwitchRouteTests
    {
        [TestMethod]
        public void TwoItems_Move_OnetoTwo_Or_OneToTwo()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "USA", Transport = "Air" } };

            int from = 1;
            int to = 0;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(newRoutes[0].Name == "UK");
            Assert.IsTrue(newRoutes[1].Name == "USA");

            Assert.IsTrue(polyLines[0].Prev == "UK");
            Assert.IsTrue(polyLines[0].Current == "USA");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");
        }

        [TestMethod]
        public void TwoItems_Move_OnetoTwo_ChangeTransport()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Land" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "UK", Transport = "Land" }, new Route() { Name = "USA", Transport = "Air" } };

            int from = 1;
            int to = 0;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "UK");
            Assert.IsTrue(polyLines[0].Current == "USA");
            Assert.IsTrue(polyLines[0].StrokeColour == "Black");
        }

        [TestMethod]
        public void ThreeItems_Move_TwotoThree()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 1;
            int to = 2;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "USA");
            Assert.IsTrue(polyLines[0].Current == "AUS");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "AUS");
            Assert.IsTrue(polyLines[1].Current == "UK");
            Assert.IsTrue(polyLines[1].StrokeColour == "Blue");
        }

        [TestMethod]
        public void ThreeItems_Move_ThreeToTwo()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 2;
            int to = 1;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "USA");
            Assert.IsTrue(polyLines[0].Current == "AUS");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "AUS");
            Assert.IsTrue(polyLines[1].Current == "UK");
            Assert.IsTrue(polyLines[1].StrokeColour == "Blue");
        }

        [TestMethod]
        public void ThreeItems_Move_ThreeToOne()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 2;
            int to = 0;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "AUS");
            Assert.IsTrue(polyLines[0].Current == "USA");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "USA");
            Assert.IsTrue(polyLines[1].Current == "UK");
            Assert.IsTrue(polyLines[1].StrokeColour == "Blue");
        }

        [TestMethod]
        public void ThreeItems_Move_ThreeToTwo_ChangeTransport()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Land" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 2;
            int to = 1;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "USA");
            Assert.IsTrue(polyLines[0].Current == "AUS");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "AUS");
            Assert.IsTrue(polyLines[1].Current == "UK");
            Assert.IsTrue(polyLines[1].StrokeColour == "Black");
        }

        [TestMethod]
        public void FourItems_Move_TwoToFour()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "ARG", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" }, new PolyLine() { Prev = "AUS", Current = "ARG", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "ARG", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 1;
            int to = 3;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "USA");
            Assert.IsTrue(polyLines[0].Current == "ARG");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "ARG");
            Assert.IsTrue(polyLines[1].Current == "AUS");
            Assert.IsTrue(polyLines[1].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[2].Prev == "AUS");
            Assert.IsTrue(polyLines[2].Current == "UK");
            Assert.IsTrue(polyLines[2].StrokeColour == "Blue");
        }
        [TestMethod]
        public void FourItems_Move_FourToOne()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "ARG", Transport = "Air" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" }, new PolyLine() { Prev = "AUS", Current = "ARG", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "ARG", Transport = "Air" }, new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" } };

            int from = 3;
            int to = 0;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "ARG");
            Assert.IsTrue(polyLines[0].Current == "USA");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "USA");
            Assert.IsTrue(polyLines[1].Current == "UK");
            Assert.IsTrue(polyLines[1].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[2].Prev == "UK");
            Assert.IsTrue(polyLines[2].Current == "AUS");
            Assert.IsTrue(polyLines[2].StrokeColour == "Blue");
        }

        [TestMethod]
        public void ThreeItems_Move_FourToTwo_ChangeTransport()
        {
            var initialRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "ARG", Transport = "Land" } };
            var polyLines = new List<PolyLine>() { new PolyLine() { Prev = "USA", Current = "UK", StrokeColour = "Blue" }, new PolyLine() { Prev = "UK", Current = "AUS", StrokeColour = "Blue" }, new PolyLine() { Prev = "AUS", Current = "ARG", StrokeColour = "Blue" } };

            var newRoutes = new List<Route>() { new Route() { Name = "USA", Transport = "Air" }, new Route() { Name = "ARG", Transport = "Land" }, new Route() { Name = "AUS", Transport = "Air" }, new Route() { Name = "UK", Transport = "Air" } };

            int from = 3;
            int to = 1;

            Service.Switch(newRoutes, polyLines, from, to);

            Assert.IsTrue(polyLines[0].Prev == "USA");
            Assert.IsTrue(polyLines[0].Current == "ARG");
            Assert.IsTrue(polyLines[0].StrokeColour == "Blue");

            Assert.IsTrue(polyLines[1].Prev == "ARG");
            Assert.IsTrue(polyLines[1].Current == "AUS");
            Assert.IsTrue(polyLines[1].StrokeColour == "Black");

            Assert.IsTrue(polyLines[2].Prev == "AUS");
            Assert.IsTrue(polyLines[2].Current == "UK");
            Assert.IsTrue(polyLines[2].StrokeColour == "Blue");
        }
    }

    public static class Service
    {
        public static void Switch(List<Route> routes, List<PolyLine> polyLines, int from, int to)
        {
            bool isSwitchingLastRoute = (from == routes.Count - 1) || (to == routes.Count - 1);

            int loopFrom = (from < to ? from : to) - 1;
            int loopTo = (to > from ? to : from);

            loopTo += isSwitchingLastRoute ? -1 : 0;

            if (loopFrom == -1) loopFrom += 1;

            for (int i = loopFrom; i <= loopTo; i++)
            {
                polyLines[i].Prev = routes[i].Name;
                polyLines[i].Current = routes[i + 1].Name;

                UpdateStrokeColour(routes[i].Transport, polyLines[i]);
            }
        }

        public static void UpdateStrokeColour(string transport, PolyLine polyLine)
        {
            if (transport == "Air")
                polyLine.StrokeColour = "Blue";
            else if (transport == "Land")
                polyLine.StrokeColour = "Black";
            else if (transport == "Sea")
                polyLine.StrokeColour = "White";
        }
    }

    public class Route
    {
        public string Name { get; set; }
        public string Transport { get; set; }
    }

    public class PolyLine
    {
        public string Current { get; set; }
        public string Prev { get; set; }
        public string StrokeColour { get; set; }
    }
}
