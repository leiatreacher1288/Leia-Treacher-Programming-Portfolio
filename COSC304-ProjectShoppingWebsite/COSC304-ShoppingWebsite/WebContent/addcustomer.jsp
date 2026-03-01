<%@ page import="java.text.NumberFormat" %>
<%@ include file="jdbc.jsp" %>
<%@ page import="java.sql.*,java.net.URLEncoder" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<!DOCTYPE html>
<html>
<head>
<title>Add/Edit Customer Page</title>
    <%session.setAttribute("form", "addcustomer.jsp");%>
    <%@ include file ="header.jsp"%>
<style>
    body, div, form, input, select, textarea, label, p { 
      padding: 0;
      margin: 0;
      outline: none;
      line-height: 22px;
      }
      h3{
        color:red;
      }
    input {
      width: calc(100% - 50px);
      padding: 5px;
      }
    textarea {
      width: calc(100% - 12px);
      padding: 5px;
      }
    .addressinput {
      width: 100%;
      padding: 5px;
      } 
    input[type=text1] {
        text-transform: capitalize;
    }
    .testbox {
      display: flex;
      justify-content: center;
      align-items: center;
      height: inherit;
      padding: 20px;
      }
    form {
      width: 100%;
      padding: 20px;
      border-radius: 6px;
      background: #fff;
      box-shadow: 0 0 8px  #669999; 
      }
    .colums {
      display:flex;
      justify-content:space-between;
      flex-direction:row;
      flex-wrap:wrap;
      }
    .colums div {
      width:50%;
      }
    .item span {
      color: red;
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

    .item input:hover, .item select:hover, .item textarea:hover {
      border: 1px solid transparent;
      box-shadow: 0 0 3px 0  #669999;
      color: #669999;
      }
    
   
</style>
</head>
<body>
    <%
        try
        {	// Load driver class
            Class.forName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        }
        catch (java.lang.ClassNotFoundException e)
        {
            throw new SQLException("ClassNotFoundException: " +e);
        }

        session = request.getSession(true);

        String fName="",lName="",email="",phoneNum="",password="";
        String address="",city="",state="",postalCode="",country="",userid="";
        String clear = request.getParameter("clear");
        // get customerId when called from customer.jsp we have a value
        // else it is null when called from login.jsp (new customer)
        String customerId = request.getParameter("customerId");
        // load the values of the field from addcustomer.jsp
        if (clear != null && clear.equals("0")){
            fName = session.getAttribute("fName").toString();
            session.removeAttribute("fName");
            lName = session.getAttribute("lName").toString();
            session.removeAttribute("lName");
            email = session.getAttribute("email").toString();
            session.removeAttribute("email");
            phoneNum = session.getAttribute("phoneNum").toString();
            session.removeAttribute("phoneNum");
            password = session.getAttribute("password").toString();
            session.removeAttribute("password");
            address = session.getAttribute("address").toString();
            session.removeAttribute("address");
            city = session.getAttribute("city").toString();
            session.removeAttribute("city");
            state = session.getAttribute("state").toString();
            session.removeAttribute("state");
            postalCode = session.getAttribute("postalCode").toString();
            session.removeAttribute("postalCode");
            country = session.getAttribute("country").toString();
            session.removeAttribute("country");
            userid = session.getAttribute("userid").toString();
            session.removeAttribute("userid");
            // over write the customerId with one passed in from validatecustomer
            customerId = session.getAttribute("customerId").toString();
            session.removeAttribute("customerId");
            
        }else if ((customerId != null) && (customerId.equals("null")==false)){
            userid = request.getParameter("userid");
            // run query to get the customer and populate the fields
            // with the customer information
            // create an array to be returned by the following method
            // with the customer information
            String[] strArray = populateFields(out, request, session);
            if (strArray != null){
                fName = strArray[0];
                lName = strArray[1];
                email = strArray[2];
                phoneNum = strArray[3];
                address = strArray[4];
                city = strArray[5];
                state = strArray[6];
                postalCode = strArray[7];
                country = strArray[8];
                userid = strArray[9];
                password = strArray[10];
                customerId = strArray[11];
            }
            
        }
    %>
    <%!
    public String[] populateFields(JspWriter out,HttpServletRequest request, HttpSession session)throws SQLException{
        String[] strArray = new String[12];
		// Get the userid from addCustomer.jsp
		String userid = (String)request.getParameter("userid");
		if(userid == null)
			return null;

		// Initialize the preparedStatement
		PreparedStatement pstmt = null;
		
		// Try with Resources
		// Java will automatically close the Connection con
		try ( Connection con = DriverManager.getConnection(url, uid, pw);){ 
	
			// Create some SQL Queries
			String QRY_GET_CUSTOMER_BY_ID = "SELECT firstName,lastName,email,phoneNum,address,"+
                                            "city,state,postalCode,country,userid,password,customerId "+
											"FROM customer "+
			   								"WHERE userid=?";
			pstmt = con.prepareStatement(QRY_GET_CUSTOMER_BY_ID);								
			pstmt.setString(1, userid);
			try (ResultSet rst = pstmt.executeQuery();) {
				if(	rst.next()){
					strArray[0] = rst.getString("firstName");
                    strArray[1] = rst.getString("lastName");
				    strArray[2] = rst.getString("email");
				    strArray[3] = rst.getString("phoneNum");
                    strArray[4] = rst.getString("address");
                    strArray[5] = rst.getString("city");
                    strArray[6] = rst.getString("state");
                    strArray[7] = rst.getString("postalCode");
                    strArray[8] = rst.getString("country");
                    strArray[9] = rst.getString("userid");
                    strArray[10] = rst.getString("password");
                    strArray[11] = rst.getString("customerId");
                 
				}
			} catch(SQLException ex){
				session.setAttribute("validationMessage",ex);
                return null;
			}
		} catch (SQLException ex){
			session.setAttribute("validationMessage",ex);
            return null;
		}
		return strArray;
	
    }
    %>
    <div class="testbox">
            <%
            out.println("<form name=\"FormAddCustomer\" method=post action=\"validatecustomer.jsp?customerId="+ customerId +"\">");
        
                if ((customerId == null) || customerId.equals("null"))
                    out.println("<h1>New Customer</h1>");
                else
                    out.println("<h1>Edit Customer Id="+customerId+"</h1>");
                 
                // Print prior error login message if present
                if (clear !=null && clear.equals("0"))
                    if (session.getAttribute("validationMessage") != null)
	                    out.println("<h3>"+session.getAttribute("validationMessage").toString()+"</h3>");
            %>
            <br/>
            <div class="colums">
                <div class="item">
                    <label for="fname">First Name<span>*</span></label>
                    <%
                    out.println("<input id=\"fName\" type=\"text1\" maxlength=\"40\" name=\"fName\"  value=\""+ fName +"\" required/>");
                    %>
                </div>
                <div class="item">
                    <label for="lName">Last Name<span>*</span></label>
                    <%
                    out.println("<input id=\"lName\" type=\"text1\" maxlength=\"40\" name=\"lName\"  value=\""+ lName +"\" required/>");
                     %>
                </div>
                <div class="item">
                    <label for="email">Email<span>*</span></label>
                    <%
                    out.println("<input id=\"email\" type=\"email\" maxlength=\"50\" name=\"email\"  value=\""+ email +"\" required/>");
                     %>
                </div>
                <div class="item">
                    <label for="phonenum">Phone Number<span>*</span></label>
                    <%
                    out.println("<input id=\"phoneNum\" type=\"tel\" maxlength=\"20\" name=\"phoneNum\"  value=\""+ phoneNum +"\" required/>");
                     %>
                </div>
            </div>
        </br>
                <div class="item">
                    <label for="address">Address<span>*</span></label>
                    <%
                    out.println("<input id=\"address\" type=\"text1\" maxlength=\"50\" name=\"address\"  value=\""+ address +"\" required/>");
                    %>
                </div>
            <div class="colums">
                <div class="item">
                    <label for="city">City<span>*</span></label>
                    <%
                    out.println("<input id=\"city\" type=\"text1\" maxlength=\"40\" name=\"city\"  value=\""+ city +"\" required/>");
                    %>
                </div>
                <div class="item">
                    <label for="state">Province/State<span>*</span></label>
                    <%
                    out.println("<input id=\"state\" type=\"text1\" maxlength=\"20\" name=\"state\"  value=\""+ state +"\" required/>");
                    %>
                </div>
                <div class="item">
                    <label for="postalCode">Postal Code<span>*</span></label>
                    <%
                    out.println("<input id=\"postalCode\" type=\"text\" maxlength=\"20\" name=\"postalCode\"  value=\""+ postalCode +"\" required/>");
                    %>
                </div>
                <div class="item">
                    <label for="country">Country<span>*</span></label>
                    <%
                    out.println("<input id=\"country\" type=\"text1\" maxlength=\"30\" name=\"country\"  value=\""+ country +"\" required/>");
                    %>
                </div>
            </div>
            </br>
            <div class="colums">
                <div class="item">
                    <label for="userid">User Name<span>*</span></label>
                    <%
                    out.println("<input id=\"userid\" type=\"text\" name=\"userid\"  value=\""+ userid +"\" required/>");
                    %>
                </div>
                <div class="item">
                    <label for="password">Password<span>*</span></label>
                    <%
                    out.println("<input id=\"password\" type=\"password\" name=\"password\"  value=\""+ password +"\" required/>");
                    %>
                </div>
            </div>
        </br>
    </br>
            <div style="text-align:center">  
                <input type="submit" value="Save User">
            </div>   
            <input type="hidden" id="customerId" name="customerId" value="<%=customerId%>">
        </form>
    </div>
    
</body>
</html>

