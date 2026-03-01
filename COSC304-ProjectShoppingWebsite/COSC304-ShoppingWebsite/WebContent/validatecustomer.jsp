<%@ page language="java" %>
<%@ page import="java.io.*" %>
<%@ page import="java.sql.*" %>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.util.regex.Pattern" %>

<%
	// clear any residual messages
	session.removeAttribute("validationMessage");
	
	//Note: Forces loading of SQL Server driver
	try
	{	// Load driver class
		Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
	}
	catch (java.lang.ClassNotFoundException e)
	{
		out.println("ClassNotFoundException: " +e);
	}
	session = request.getSession(true);

	// load the input values from addcustomer.jsp
	// then set the attributes so when this page
	// get redirected back to addcustomer.jsp the
	// data can be reententerd and not lost.
	String password = request.getParameter("password");
	session.setAttribute("password",password);
	String fName = request.getParameter("fName");
	session.setAttribute("fName",fName);
	String lName = request.getParameter("lName");
	session.setAttribute("lName",lName);
	String email = request.getParameter("email");
	session.setAttribute("email",email);
	String phoneNum = request.getParameter("phoneNum");
	session.setAttribute("phoneNum",phoneNum);		
	String address = request.getParameter("address");
	session.setAttribute("address",address);		
	String city = request.getParameter("city");
	session.setAttribute("city",city);		
	String state = request.getParameter("state");
	session.setAttribute("state",state);		
	String postalCode = request.getParameter("postalCode");
	session.setAttribute("postalCode",postalCode);		
	String country = request.getParameter("country");
	session.setAttribute("country",country);		
	String userid = request.getParameter("userid");
	session.setAttribute("userid",userid);		
	String customerId = request.getParameter("customerId");
	session.setAttribute("customerId",customerId);
	
	boolean validationCheck = false;
	if((validateEmail(out,request,session) == true )  &&
	  (validatePostalCode(out,request,session) == true) &&
	  (validateUserId(out,request,session) == true) &&
	  (validatePassword(out, request, session) == true))
		validationCheck = true;
		
	String returnToPage="";
	boolean newCustomer = false;
	if ((customerId != null) && (customerId.equals("null") == false) && (customerId.equals("") == false))
		newCustomer = true;
	boolean updateCheck = false;// update customer
	boolean insertCheck = false;// insert new customer
	if (validationCheck == true) {
		// customerId = "null" it means it is a new customer
		if (customerId.equals("null")) {
			if (addNewCustomer(out, request, session) == true){
				insertCheck = true;
			}
		}else if (updateCustomer(out, request, session) == true){
			updateCheck = true;
		}
	}
	
	// If everything checks out then redirect to login screen
	// else go back to add customer screen
	if ((validationCheck == true) && (insertCheck == true)){
		returnToPage = "login.jsp";
	}else if ((validationCheck == true) && (updateCheck == true) ){
		returnToPage = "customer.jsp";
	}else if (validationCheck == false){
		returnToPage = "addcustomer.jsp?clear=0";
	}else{
		returnToPage = "index.jsp";
	}
	
	response.sendRedirect(returnToPage);
		
%>	

<%!
public boolean updateCustomer(JspWriter out,HttpServletRequest request, HttpSession session) throws SQLException
{
	// clear any residual messages
	session.removeAttribute("validationMessage");
	
	boolean retval = true;
	PreparedStatement pstmt = null; 

	// check if we can get the customerId Sting value "null"
	// means no customerId
	String customerId = request.getParameter("customerId");
	
	if (customerId.equals("null"))
		retval = false;
	else {
		// Try with Resources
		// Java will automatically close the Connection con
		try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
			String query = "UPDATE customer SET firstName=?,"+
												"lastName=?, "+
												"email=?, "+
												"phonenum=?, "+
												"address=?, "+
												"city=?, "+
												"state=?, "+
												"postalCode=?, "+
												"country=?, "+
												"userid=?, "+
												"password=? "+
							"WHERE customerId=?";
			pstmt = con.prepareStatement(query); 
			pstmt.setString(1, request.getParameter("fName"));
			pstmt.setString(2, request.getParameter("lName"));
			pstmt.setString(3, request.getParameter("email"));
			pstmt.setString(4, request.getParameter("phoneNum"));
			pstmt.setString(5, request.getParameter("address"));
			pstmt.setString(6, request.getParameter("city"));
			pstmt.setString(7, request.getParameter("state"));
			pstmt.setString(8, request.getParameter("postalCode"));
			pstmt.setString(9, request.getParameter("country"));
			pstmt.setString(10, request.getParameter("userid"));
			pstmt.setString(11, request.getParameter("password"));
			pstmt.setString(12, customerId);
			
			pstmt.executeUpdate();
			
		} catch (SQLException ex){
			session.setAttribute("validationMessage","Failed to update user: SQLException:"+ex);
		}
	}
	if(retval == false){
		session.setAttribute("validationMessage","Failed to update existing user");
	}
	return retval;
}
public boolean updateCustomerold(JspWriter out,HttpServletRequest request, HttpSession session) throws SQLException
{
	// clear any residual messages
	session.removeAttribute("validationMessage");
	boolean retval = false;
	PreparedStatement pstmt = null; 
	// check if we can get the customerId Sting value "null"
	// means no customerId
	String customerId = request.getParameter("customerId");
	
	if (!customerId.equals("null"))
		retval = false;
	else {
		// Try with Resources
		// Java will automatically close the Connection con
		try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
			
			String query = "UPDATE customer SET firstName=?,"+
												"lastName=?, "+
												"email=?, "+
												"phonenum=?, "+
												"address=?, "+
												"city=?, "+
												"state=?, "+
												"postalCode=?, "+
												"country=?, "+
												"userid=?, "+
												"password=? "+
							"WHERE customerId=?";
			pstmt = con.prepareStatement(query); 
			pstmt.setString(1, request.getParameter("fName"));
			pstmt.setString(2, request.getParameter("lName"));
			pstmt.setString(3, request.getParameter("email"));
			pstmt.setString(4, request.getParameter("phoneNum"));
			pstmt.setString(5, request.getParameter("address"));
			pstmt.setString(6, request.getParameter("city"));
			pstmt.setString(7, request.getParameter("state"));
			pstmt.setString(8, request.getParameter("postalCode"));
			pstmt.setString(9, request.getParameter("country"));
			pstmt.setString(10, request.getParameter("userid"));
			pstmt.setString(11, request.getParameter("password"));
			pstmt.setString(12, customerId);
			
			pstmt.executeUpdate();
			// successful run hopefully
			retval = true;
		} catch (SQLException ex){
			//session.setAttribute("validationMessage","SQLException: Failed to add User to database.");
			session.setAttribute("validationMessage","Failed to update user: SQLException:"+ex);
		}
	}
	if(retval == false)
		session.setAttribute("validationMessage","Failed to update existing user");
	
	return retval;
}


public boolean addNewCustomer(JspWriter out,HttpServletRequest request, HttpSession session) throws SQLException
{
	session.removeAttribute("validationMessage");
	boolean retval = false;
	PreparedStatement pstmt = null; 
	// Try with Resources
	// Java will automatically close the Connection con
	try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
		String query = "INSERT INTO customer(firstName, "+
											"lastName, "+
											"email, "+
											"phonenum, "+
											"address, "+
											"city, "+
											"state, "+
											"postalCode, "+
											"country, "+
											"userid, "+
											"password) "+
						"VALUES (?,?,?,?,?,?,?,?,?,?,?)";
		pstmt = con.prepareStatement(query); 
		pstmt.setString(1, request.getParameter("fName"));
		pstmt.setString(2, request.getParameter("lName"));
		pstmt.setString(3, request.getParameter("email"));
		pstmt.setString(4, request.getParameter("phoneNum"));
		pstmt.setString(5, request.getParameter("address"));
		pstmt.setString(6, request.getParameter("city"));
		pstmt.setString(7, request.getParameter("state"));
		pstmt.setString(8, request.getParameter("postalCode"));
		pstmt.setString(9, request.getParameter("country"));
		pstmt.setString(10, request.getParameter("userid"));
		pstmt.setString(11, request.getParameter("password"));
		
		pstmt.executeUpdate();
		
		retval = true;
	} catch (SQLException ex){
		//session.setAttribute("validationMessage","SQLException: Failed to add User to database.");
		session.setAttribute("validationMessage","Failed to add User: SQLException:"+ex);
	}
	if(retval == false)
		session.setAttribute("validationMessage","Failed to add New User.");
	
	return retval;
}

	public boolean validateUserId(JspWriter out,HttpServletRequest request, HttpSession session)throws SQLException{
		boolean retval=false;
		// clear the validateMessage attribute
		session.removeAttribute("validationMessage");
		// If customerId does not equal "null" then do not need to
		// validate User ID because we are doing an update.
		String customerId = request.getParameter("customerId");
		if (!customerId.equals("null"))
			return true;

		// Get the userid from addCustomer.jsp
		String userid = (String)request.getParameter("userid");
		if(userid == null)
			retval = false;

		// Initialize the preparedStatement
		PreparedStatement pstmt = null;
		
		// Try with Resources
		// Java will automatically close the Connection con
		try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
	
			// Create some SQL Queries
			String QRY_GET_CUSTOMER_BY_ID = "SELECT customerId "+
											"FROM customer "+
			   								"WHERE userid=?";
			pstmt = con.prepareStatement(QRY_GET_CUSTOMER_BY_ID);								
			pstmt.setString(1, userid);
			try (ResultSet rst = pstmt.executeQuery();) {
				if(	!rst.next()){
					retval = true;  // User Name is not taken
				}
			} catch(SQLException ex){
				session.setAttribute("validationMessage",ex);
			}
		} catch (SQLException ex){
			session.setAttribute("validationMessage",ex);
		}
		if(retval == false)
			session.setAttribute("validationMessage","User Name exists.  Please choose another one.");
		return retval;
	
	}
	public boolean validateEmail(JspWriter out,HttpServletRequest request, HttpSession session)
	{
        Pattern pat = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);
        boolean retval;

		String email = request.getParameter("email");
		if(email == null)
				retval = false;
		if(email.length() == 0)
				retval = false;

        if (pat.matcher(email).matches())
            retval = true;
        else
            retval = false;

        if(retval == true)
			session.removeAttribute("validationMessage");
		else
			session.setAttribute("validationMessage","Email address is incorrect. Please verify your email address.");
		return retval;
	}

	public boolean validatePostalCode(JspWriter out,HttpServletRequest request, HttpSession session)
	{
        Pattern pat = Pattern.compile("^(?!.*[DFIOQU])[A-VXY][0-9][A-Z] ?[0-9][A-Z][0-9]$", Pattern.CASE_INSENSITIVE);
        boolean retval;

		String postalCode = (String)request.getParameter("postalCode");
		String country = (String) request.getParameter("country");
		// Only check postal code for Canada
		if(country == null)
			return true;  // do not need to check postal code
		if (country.toUpperCase().equals("CANADA")){
			if(postalCode == null)
					retval = false;
			if(postalCode.length() == 0)
					retval = false;

			if (pat.matcher(postalCode).matches())
				retval = true;
			else
				retval = false;

			if(retval == true)
				session.removeAttribute("validationMessage");
			else
				session.setAttribute("validationMessage","Invalid Postal Code.  Please enter a correct Postal Code");
			return retval;
		} else
			return true;
	}

	public boolean validatePassword(JspWriter out,HttpServletRequest request, HttpSession session){
        // Check if password has at least 8 characters
		String password = request.getParameter("password");
		boolean retval;
		if(password == null)
				retval = false;
		if (password.length() < 8) {
            retval = false;
        }
        // Password should have at least one numeric digit, upper case letter and a special character
        if (!password.matches(".*\\d.*") || !password.matches(".*[A-Z].*")  || !password.matches(".*[@#$%^&+=!].*")){
            retval = false;
        } else
            retval =  true;

		if(retval == true)
			session.removeAttribute("validationMessage");
		else
			session.setAttribute("validationMessage","Password should be at least 8 characters long.\n\rPassword should contain 1 numeric digit, 1 uppercase letter, and 1 special character");
		return retval;
    }
%>