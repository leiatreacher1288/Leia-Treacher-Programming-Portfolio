<!DOCTYPE html>
<html>
<head>
	<%@ include file="header.jsp"%>
<title>Login Screen</title>
<style>
	input[type=text]{
		width: 200px;
		font-size: 16px;
	}
	input[type=password]{
		width: 200px;
		font-size: 16px;
	}
	.label{
		font-size: 16px;
	}
	input[type=submit] {
		font-size: 16px;
		width: 150px;
		background-color:rgb(9, 195, 108);
		border: none;
		color: rgb(251, 250, 250);
		padding: 4px 4px;
		cursor: pointer;
		margin-left:30px;
		margin-right:30px;
}  
	
</style>
</head>
<body>

<div style="margin:0 auto;text-align:center;display:inline">

<h3>Please Login to System</h3>

<%
// name of the jsp form that called login//
String callingForm = null;
callingForm = request.getParameter("form");
//String callingForm = (String)session.getAttribute("form");
//session.removeAttribute("form");
	
// Print prior error login message if present
if (session.getAttribute("loginMessage") != null)
	out.println("<p>"+session.getAttribute("loginMessage").toString()+"</p>");
%>

<br>
<form name="MyForm" method=post action="validateLogin.jsp">
<table style="display:inline">
<tr>
	<td><div align="right"><font face="Arial, Helvetica, sans-serif" font-size: 16px >Username:</font></div></td>
	<td><input type="text" name="username"  size=10 maxlength=20></td>
</tr>
<tr>
	<td><div align="right"><font face="Arial, Helvetica, sans-serif" font-size: 16px >Password:</font></div></td>
	<td><input type="password" name="password" size=10 maxlength="30"></td>
</tr>
</table>
<input type="hidden" name="form" value="<%=callingForm%>">
<br/>
<br/>
<input class="submit" type="submit" name="Submit2" value="Log In">
<input type="submit" value="Create Account" onclick="form.action='addcustomer.jsp?clear=1';">
</form>

</div>

</body>
</html>

