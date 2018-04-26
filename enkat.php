<!DOCTYPE HTML>
<html>
	<head>
		<title>Phadderiet MPiRE</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<!--[if lte IE 8]><script src="assets/js/ie/html5shiv.js"></script><![endif]-->
		<link rel="stylesheet" href="assets/css/main.css" />
		<!--[if lte IE 8]><link rel="stylesheet" href="assets/css/ie8.css" /><![endif]-->
		<!--[if lte IE 9]><link rel="stylesheet" href="assets/css/ie9.css" /><![endif]-->
		<script type="text/javascript" src="upclick-min.js"></script>
		<script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
      ga('create', 'UA-65179286-1', 'auto');
      ga('send', 'pageview');
    </script>

	</head>
	<body>

		<!-- Page Wrapper -->
		<div id="page-wrapper">

			<!-- Header -->
			<header id="header">
				<h1><a href="index.html">MPiRE</a></h1>
				<nav id="nav">
					<ul>
						<li class="special">
							<a href="#menu" class="menuToggle" id="v1"><span>MENY</span></a>
							<div id="menu">
								<ul id="v1">
									<li><a href="index.html">Hemsidans Hem</a></li>
									<li><a href="avgift.html">NOLLE-AVGIFT</a></li>
									<li><a href="forsta.html">FÖRSTA DAGEN</a></li>
									<li><a href="enkat.php">NOLLE-ENKÄT</a></li>
									<li><a href="kalender.html">KALENDER</a></li>
									<li><a href="bricka.html">NOLLE-BRICKA</a></li>
									<li><a href="fragor.html">FRÅGOR</a></li>
									<li><a href="lankar.html">LÄNKAR</a></li>
									<li><a href="hagbard.html">SAGAN OM HAGBARD</a></li>
									<li><a href="brasaker.html">MPiRE GODKÄNNER</a></li>
								</ul>
							</div>
						</li>
					</ul>
				</nav>
			</header>


			<!-- Main -->
			<article id="main">
				<header>
					<h2>NOLLE-ENKÄT</h2>
					<p>Viktigare än att ärligt genomföra sju polisförhör</p>
				</header>
				<section class="wrapper style1" id="enkat1">

					<div class="inner">
						<div id="lefy">
							<h3>Välj en fin bild på Ø:an</h3>
							<div id="box1">
							<a input type="button" id="uploader" value="Välj bild!">TRYCK MIG!</a></div>
							</div>
						</div>
						<div id="enkat">
						<iframe width="100%" height="100%" border="0" id="enkat" src="https://docs.google.com/forms/d/1qfffCx3FVv397Ap0ipTrm44j_07jhUsXbi7kYRjlpiM/viewform?embedded=true" frameborder="0"><h1 id="lefy"><a href="https://docs.google.com/forms/d/1EzQpF4xXFMeXJ7TUrMPeQSUdnKaYCFxtSA23ECj_It8/viewform?usp=send_form">Klicka här</a><br><br> om det krånglar för NOLLAN.</h1></iframe></div>

							<div class="inner"><div id="lefy">
								<p id="v1"><a href="https://docs.google.com/forms/d/1EzQpF4xXFMeXJ7TUrMPeQSUdnKaYCFxtSA23ECj_It8/viewform?usp=send_form">Klicka här</a>
								<br><br>om det verkligen krånglar för NOLLAN.</p></div>
							</div>
						</section>
					</article>

					<!-- Footer -->
					<footer id="footer">
						<h1><a href="enkat.php">Fyll i NOLLE-ENKÄTEN</a></h1><br>
						<ul class="icons">
							<li><a href="https://www.facebook.com/pages/M-sektionens-Nolle-P-2015/992971554080428" class="icon fa-facebook"><span class="label">Facebook</span></a></li>
							<li><a href="#" class="icon fa-instagram"><span class="label">Instagram</span></a></li>
							<li><a href="kalender.html" class="icon fa-calendar"><span class="label">Dribbble</span></a></li>
							<li><a href="fragor.html" class="icon fa-envelope-o"><span class="label">Email</span></a></li>
						</ul>
						<ul class="copyright">
						<li id="v1">&copy; MPiRE ÄGER ALLAS RÄTTIGHETER</a></li>
						</ul>
					</footer>

				</div>

				<!-- Scripts -->
				<script src="assets/js/jquery.min.js"></script>
				<script src="assets/js/jquery.scrollex.min.js"></script>
				<script src="assets/js/jquery.scrolly.min.js"></script>
				<script src="assets/js/skel.min.js"></script>
				<script src="assets/js/util.js"></script>
				<!--[if lte IE 8]><script src="assets/js/ie/respond.min.js"></script><![endif]-->
				<script src="assets/js/main.js"></script>
				<script type="text/javascript">

					var uploader = document.getElementById('uploader');

					upclick(
					{
						element: uploader,
						action: 'picupload.php',
						onstart:
						function(filename)
						{
							alert('Din bild laddas upp, fyll i formuläret så länge men klicka ej på "skicka" förens du får en bekräftelse');
						},
						oncomplete:
						function(response_data)
						{
							alert(response_data);
						}
					});

				</script>

			</body>
		</html>