<?php
session_start();
$tmp_file_name = $_FILES['Filedata']['tmp_name'];
$type=substr($_FILES['Filedata']['name'],-5);

$timestamp=date('y',time())."-".date('m',time())."-".date('d',time())." ".date('H',time())."_".date('i',time())." ";
$file="pics/".$timestamp.$type;
$size=$_FILES['Filedata']['size'] / 1048576;
$_SESSION['bild']=$timestamp.$type;

$ext = pathinfo($file, PATHINFO_EXTENSION);

strtolower($ext);
$exts=array(jpeg,jpg,png,gif,JPEG,JPG,PNG,GIF);
if($size>=5){
	
	echo "Din bild var på tok för stor NOLLAN, du vill väl inte att servern ska bli tjock! Välj en mindre bild på NOLLAN!";
}
elseif(!in_array($ext, $exts))
{echo "Skumt filformat på din bild, ladda upp en annan bild NOLLAN!";}

else{

move_uploaded_file($tmp_file_name, $file);
echo "Din bild har befinner sig nu i mongoliet, NOLLAN kan nu fortsätta som vanligt...";

}
