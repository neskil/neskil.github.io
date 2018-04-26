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
        <script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

      ga('create', 'UA-65179286-1', 'auto');
      ga('send', 'pageview');

    </script>
	</head>


<?php

//Settings for phpCAS Central Authentication Service
	$cas_host='login.liu.se/cas';
	$cas_port=443;
	
// phpCAS simple client
// import phpCAS lib
include_once 'CAS/CAS.php';

// initialize phpCAS
phpCAS::client(CAS_VERSION_2_0,$cas_host,$cas_port,'');

// Unless you properly set upp SSL-verification
phpCAS::setNoCasServerValidation();

//CAS authentication
if(isset($_REQUEST['login'])){
	
phpCAS::forceAuthentication();
// at this step, the user has been authenticated by the CAS server
// and the user's login name can be read with phpCAS::getUser().
}

// logout if desired
if (isset($_REQUEST['logout'])) {
 phpCAS::logout();
}
if(phpCAS::isAuthenticated()){
	//Get profile from database
	$profile_result=getProfile($conn, phpCAS::getUser());
	
	//If there are strict one profile on this liuid
	if (mysql_num_rows($profile_result)==1) {
		$profile=true;
		$profile_row = mysql_fetch_array($profile_result);
		$profile_id=$profile_row["id"];
	}
}

?>
<body>
<div class='row row-centered'>
	<div class='col-xs-11 col-centered'>

		<?php //check if logged in 
		if(phpCAS::isAuthenticated()){ ?>
			Du är inloggad som: <b><?php echo phpCAS::getUser(); ?></b>
			<a class="btn btn-default" href="?logout=true">Logga ut</a>
		<?php }else{ ?>
			<a class="btn btn-default" href="?login=true">Logga in</a>
		<?php }?>
		<div class="alerts"></div>
	</div>
</div>

<!-- Scripts -->
		<script src="assets/js/jquery.min.js"></script>
		<script src="assets/js/jquery.scrollex.min.js"></script>
		<script src="assets/js/jquery.scrolly.min.js"></script>
		<script src="assets/js/skel.min.js"></script>
		<script src="assets/js/util.js"></script>
		<!--[if lte IE 8]><script src="assets/js/ie/respond.min.js"></script><![endif]-->
		<script src="assets/js/main.js"></script>

	</body>
</html>