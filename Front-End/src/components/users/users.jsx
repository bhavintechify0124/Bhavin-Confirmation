import React, { useEffect, useState } from "react";
import {
  adminUsersListAction,
  changeUsersStatusAction,
  deleteUserAction,
} from "../../Redux/Admin/AdminAction";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  deleteUserReducer,
  toggleCheckbox,
} from "../../Redux/Admin/AdminSlice";
import { useLocation, useNavigate } from "react-router-dom";
import debounce from "lodash/debounce"; // Import the debounce function
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import data from "../../assets/data.json";
import { getSkillListAction } from "../../Redux/User/UserAction";
import defaultImage from "../../assets/profileImg.webp";
import ViewUser from "../viewUser/viewUser";
import { clearUser } from "../../Redux/Auth/AuthSlice";
const apiUrl = import.meta.env.VITE_BASE_URL;

const UserTable = () => {
  const users = useSelector((state) => state.admin.userList.users);
  const skills = useSelector((state) => state?.user.skillList.skills);
  const userPage = useSelector((state) => state.admin.userList.page_count);
  const [page, setPage] = useState(1);
  const [sizePerPage, setSizePerPage] = useState(5);
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [skillName, setSkillName] = useState("");
  const [gender, setGender] = useState("");
  const [department, setDepartment] = useState("");
  const dispatch = useDispatch();
  const location = useLocation();
  const adminUrl = location.pathname.includes("admin");
  const activeUser = useSelector((state) => state?.auth.user);
  const [searchKey, setSearchKey] = useState("");
  const navigate = useNavigate();

  const handleToggle = (itemId, currentStatus) => {
    dispatch(toggleCheckbox(itemId));
    dispatch(
      changeUsersStatusAction({
        functions: {
          onComplete,
          onError,
          formData: { status: !currentStatus, itemId },
        },
      })
    );
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleSizePerPageChange = (size) => {
    setSizePerPage(size);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const onComplete = (response, type) => {
    if (type === "delete") toast.success(response.data.message);
  };
  const onError = (response) => {
    toast.error(response.data.message);
  };

  const deleteUser = (userId) => {
    dispatch(
      deleteUserAction({
        functions: {
          onComplete,
          onError,
          formData: {
            userId: userId,
          },
        },
      })
    );

    dispatch(deleteUserReducer(userId));
  };
  useEffect(() => {
    dispatch(
      adminUsersListAction({
        functions: {
          onComplete,
          onError,
          formData: {
            page: page,
            items_per_page: sizePerPage,
            sort_field: sortKey,
            sort_order: sortOrder,
            search: searchKey,
            skill_name_n: skillName,
            gender: gender,
            department: department,
          },
        },
      })
    );
  }, [page, sizePerPage, sortKey, sortOrder, skillName, gender, department]);

  const pageOptions = [5, 10]; // Options for page count dropdown

  useEffect(() => {
    if (activeUser === null) {
      navigate("/signin");
    } else if (activeUser?.role === "admin" && !adminUrl) {
      dispatch(logOut());
      navigate("/admin/signin?logout=true");
    } else if (activeUser?.role === "user" && adminUrl) {
      dispatch(logOut());
      navigate("/signin?logout=true");
    }
  }, []);

  useEffect(() => {
    dispatch(
      getSkillListAction({
        functions: {
          onComplete,
          onError,
          formData: {},
        },
      })
    );
  }, []);

  const handleSearchInputChange = (val) => {
    setSearchKey(val);
  };

  // Use debounce to delay the API request
  const debouncedSearch = debounce(
    (searchKey) => {
      dispatch(
        adminUsersListAction({
          functions: {
            onComplete,
            onError,
            formData: {
              page: page,
              items_per_page: sizePerPage,
              sort_field: sortKey,
              sort_order: sortOrder,
              search: searchKey,
            },
          },
        })
      );
    },
    1000 // Delay time in milliseconds
  );

  useEffect(() => {
    debouncedSearch(searchKey);
    return () => debouncedSearch.cancel();
  }, [searchKey]);

  return (
    <div class="card-body px-3 px-md-7 px-xl-4 " style={{ marginTop: "-10px" }}>
      <div class="row">
        <div class="d-flex justify-content-between">
          <div class="mb-4 col-5">
            <h3>Users</h3>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div
          className="col-md-6 mb-3"
          style={{ width: "300px", marginLeft: "10px" }}
        >
          <input
            type="text"
            className="form-control"
            id="search"
            placeholder="Search..."
            onChange={(e) => handleSearchInputChange(e.target.value)}
          />
        </div>
        <div
          className="col-md-6 mb-3"
          style={{ width: "300px", marginRight: "10px" }}
        >
          <select
            class="form-select"
            aria-label="Default select example"
            onChange={(e) =>
              setSkillName(
                e.target.value === "Select Skill (All)" ? "" : e.target.value
              )
            }
          >
            <option selected>Select Skill (All)</option>
            {skills?.map((skill, index) => (
              <option key={index} value={skill.value}>
                {skill.label}
              </option>
            ))}
          </select>
        </div>
        <div
          className="col-md-6 mb-3"
          style={{ width: "300px", marginRight: "10px" }}
        >
          <select
            class="form-select "
            aria-label="Default select example"
            onChange={(e) =>
              setGender(
                e.target.value === "Select Gender (All)" ? "" : e.target.value
              )
            }
          >
            <option selected>Select Gender (All)</option>
            {data?.gender?.map((gender, index) => (
              <option key={index} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </div>
        <div
          className="col-md-6 mb-3"
          style={{ width: "300px", marginRight: "10px" }}
        >
          <select
            class="form-select "
            aria-label="Default select example"
            onChange={(e) =>
              setDepartment(
                e.target.value === "Select Department (All)"
                  ? ""
                  : e.target.value
              )
            }
          >
            <option selected>Select Department (All)</option>
            {data?.departments?.map((department, index) => (
              <option key={index} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="container-fluid">
        <table className="table table-striped">
          <thead>
            <tr>
              <th style={{ cursor: "pointer" }}>
                Profile
                {sortKey === "profile_image" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("first_name")}
                style={{ cursor: "pointer" }}
              >
                Name{" "}
                {sortKey === "first_name" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "first_name" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("email")}
                style={{ cursor: "pointer" }}
              >
                Email{" "}
                {sortKey === "email" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "email" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("contact_number")}
                style={{ cursor: "pointer" }}
              >
                Contact Number{" "}
                {sortKey === "contact_number" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "contact_number" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("department")}
                style={{ cursor: "pointer" }}
              >
                Department{" "}
                {sortKey === "department" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "department" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("gender")}
                style={{ cursor: "pointer" }}
              >
                Gender{" "}
                {sortKey === "gender" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "gender" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("skills")}
                style={{ cursor: "pointer" }}
              >
                Skills{" "}
                {sortKey === "skills" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "skills" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("is_active")}
                style={{ cursor: "pointer" }}
              >
                Status{" "}
                {sortKey === "is_active" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "is_active" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th
                onClick={() => handleSort("is_verified")}
                style={{ cursor: "pointer" }}
              >
                Verification Status{" "}
                {sortKey === "is_verified" ? (
                  sortOrder === "asc" ? (
                    <FontAwesomeIcon icon={faArrowUp} />
                  ) : (
                    <FontAwesomeIcon icon={faArrowDown} />
                  )
                ) : (
                  ""
                )}
                {sortKey === "is_verified" && (
                  <span className="ml-1">
                    {sortOrder === "asc" ? (
                      <i className="fas fa-caret-up"></i>
                    ) : (
                      <i className="fas fa-caret-down"></i>
                    )}
                  </span>
                )}
              </th>
              <th style={{ cursor: "pointer" }}>Actions </th>
              <th style={{ cursor: "pointer" }}></th>
            </tr>
          </thead>
          <tbody>
            {users?.map((item) => (
              <tr key={item._id}>
                <td>
                  <img
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                    }}
                    src={
                      item?.profile_image
                        ? `${apiUrl}/${item?.profile_image}`
                        : defaultImage
                    }
                  ></img>
                </td>
                <td>{item.first_name + " " + item.last_name}</td>
                <td>{item.email}</td>
                <td>{item.contact_number}</td>
                <td>
                  {item.department || !item.department === undefined
                    ? item.department
                    : "-"}
                </td>
                <td>
                  {item.gender || !item.gender === undefined
                    ? item.gender
                    : "-"}
                </td>
                <td>
                  <td>
                    {item?.skills[0] ? (
                      item?.skills?.map((skill, index) => (
                        <div
                          key={index}
                          style={{
                            display: "inline-block",
                            marginRight: "7px",
                            marginBottom: "7px",
                          }}
                        >
                          <p>{skill.label}</p>
                        </div>
                      ))
                    ) : (
                      <p>-</p>
                    )}
                  </td>
                </td>

                <td>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      role="switch"
                      disabled={!item.is_verified ? true : false}
                      defaultChecked={item.is_active}
                      htmlFor={`flexSwitchCheckChecked-${item._id}`}
                      //   checked={isChecked}
                      onChange={() => handleToggle(item._id, item.is_active)}
                    />
                    <label
                      class="form-check-label"
                      htmlFor={`flexSwitchCheckChecked-${item._id}`}
                    ></label>
                  </div>
                </td>
                <td>
                  {item.is_verified ? "Verified" : "Verification Pending"}
                </td>
                <td>{<ViewUser item={item} />}</td>
                <td>
                  {
                    <FontAwesomeIcon
                      icon={faTrash}
                      onClick={() => {
                        deleteUser(item._id);
                      }}
                      style={{
                        alignSelf: "center",
                        marginRight: "3rem",
                        cursor: "pointer",
                        fontSize: "1.5rem", // Adjust the size here
                      }}
                    />
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users?.length < 1 && (
          <>
            <div
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                height: "200px",
              }}
            >
              <h3>Data not available</h3>
            </div>
          </>
        )}
        <div class="d-flex  justify-content-between">
          <div className="mb-4 col-5">
            <label htmlFor="sizePerPage">Page Count: </label>
            <select
              id="sizePerPage"
              value={sizePerPage}
              onChange={(e) => {
                const count = parseInt(e.target.value);
                setSizePerPage(count);
                setSizePerPage(count);
                setPage(1); // Reset page number when changing page count
              }}
            >
              {pageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <nav aria-label="Page navigation">
            <ul className="pagination justify-content-center">
              <li
                className={`page-item ${
                  page === 1 || users?.length < 1 ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
              </li>
              {[...Array(userPage)].map((_, index) => (
                <li
                  key={index}
                  className={`page-item ${page === index + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}

              {/* Add more page numbers here */}
              <li
                className={`page-item ${
                  page === userPage || users?.length < 1 ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
