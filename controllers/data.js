import CompanyData from "../models/Company.js";
import User from "../models/User.js";
import dayjs from "dayjs"
import mongoose from "mongoose";
import { Types } from "mongoose";
import fs from "fs/promises"


export const saveSales = async (req, res) => {

  try {

    const {
      userId,
      companyId,
      date,
      contents,
      savedDocName,
      salesStatus
    } = req.body;
    
    const company = await CompanyData.findByIdAndUpdate(
      companyId,
      {
        status: salesStatus,
        $push: {
          sales: {
            date,
            contents,
            savedDocName: req.file ? req.file.filename : savedDocName,
            salesStatus
        }}
      },
      {new: true}
    );

    res.status(201).json(company);
    
  } catch (err) {
    res.status(409).json(err.message);
  }

}

export const updateSales = async (req, res) => {

  try {

    const {
      userId,
      companyId,
      salesId,
      date,
      contents,
      savedDocName,
      originalSavedDocName,
      salesStatus
    } = req.body;

    const updatedData = await CompanyData.findOneAndUpdate(
      {
        _id: companyId,
        "sales._id": salesId,
      },
      {
        status: salesStatus,
        $set: { 
          "sales.$.date": date,
          "sales.$.contents": contents,
          "sales.$.savedDocName": req.file ? req.file.filename : savedDocName,
          "sales.$.salesStatus": salesStatus,
        },
      },
      { new: true },
    );

    res.status(201).json(updatedData);
  
    if (req.file && originalSavedDocName !== "") {
      if (req.file?.filename !== originalSavedDocName) {
        await fs.unlink("../uploaded_files/" + originalSavedDocName);
      }
    } else if (originalSavedDocName !== "") {
      if (savedDocName === "") {
        await fs.unlink("../uploaded_files/" + originalSavedDocName);
      }
    }
  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const deleteSales = async (req, res) => {
  try {
  
    const { companyId, salesId, savedDocName } = req.body;

    const deleted = await CompanyData.findByIdAndUpdate(
      companyId,
      { $pull: { sales: { _id: salesId } } },
      {new: true}
    )

    if (savedDocName !== "") {
      await fs.unlink("../uploaded_files/" + savedDocName);
    }
    
    res.status(201).json(deleted);
    
  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const getSales = async (req, res) => {
  const {
    userId,
    userName,
    searchWhat,
    companyRegistNo,
    exceptEnd,
    from,
    to,
    region1,
    region2,
    region3,
    salesType,
    status,
    companion,
    group,
    mainUser,
  } = req.body;

  try {
    let query;

    if (mainUser) {
      query = {
        userId: mainUser._id,
        $and: [],
      };
    } else {
      query = {
        userId: userId,
        $and: [],
      };
    }

    if (searchWhat === "companyName") {
      if (companyRegistNo !== "")
        query.companyName = {
          $regex: companyRegistNo,
          $options: "i",
        };
    } else if (searchWhat === "registNo") {
      if (companyRegistNo !== "") query.registNo = companyRegistNo;
    }

    if (from !== "" || to !== "") {
      query["sales.date"] = {
        $gte: from === "" ? "2000-01-01" : from,
        $lte: to === "" ? "2999-12-31" : to,
      };
    }

    query.$and.push({ address: { $regex: region1, $options: "i" } });
    query.$and.push({ address: { $regex: region2, $options: "i" } });
    query.$and.push({ address: { $regex: region3, $options: "i" } });

    if (exceptEnd === "종료제외") {
      if (status === "전체") query.status = { $ne: "종료" };
      else query.status = status;
    } else {
      if (status !== "전체") query.status = status;
    }

    if (salesType !== "전체") {
      query.salesType = salesType;
    }

    if (mainUser) {
      query.companion = userName;
      if (group !== "전체") {
        query.group = group;
      }
    } else {
      if (companion === "미지정") {
        query.companion = "";
      } else {
        if (companion !== "전체") {
          query.companion = companion;
        }
        if (group !== "전체") {
          query.group = group;
        }
      }
    }

    const count = await CompanyData.countDocuments(query);
    const companies = await CompanyData.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(201).json({ companies, count });
  } catch (err) {
    res.status(409).json(err.message);
  }
};

export const getSalesLapse = async (req, res) => {
  const {
    userId,
    lapse,
    region1,
    region2,
    region3,
    salesType,
    status,
    companion,
    group,
  } = req.body;

  const date = new Date();
  date.setDate(date.getDate() - lapse);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  try {
    const query = {
      userId: userId,
      $and: [],
      $expr: {
        $and: [
          { $gte: [{ $size: "$sales" }, 1] },
          {
            $lte: [
              { $arrayElemAt: ["$sales.date", -1] },
              `${yyyy}-${mm}-${dd}`,
            ],
          },
        ],
      },
    };

    query.$and.push({ address: { $regex: region1, $options: "i" } });
    query.$and.push({ address: { $regex: region2, $options: "i" } });
    query.$and.push({ address: { $regex: region3, $options: "i" } });

    if (salesType !== "전체") {
      query.salesType = salesType;
    }
    if (companion === "미지정") {
      query.companion = "";
    } else {
      if (companion !== "전체") {
        query.companion = companion;
      }
      if (group !== "전체") {
        query.group = group;
      }
    }

    const count = await CompanyData.countDocuments(query);

    const companies = await CompanyData.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(201).json({ companies, count });
  } catch (err) {
    res.status(409).json(err.message);
  }
};

export const getStatistics = async (req, res) => {

  const { userId, userName, mainUser } = req.body
  
  const today = new Date();
  // 오늘이 포함된 이번주 월~일까지의 날짜를 구함
  function getCurrentWeek() {
    const day = today.getDay(); // 현재 요일 (0: 일요일 ~ 6: 토요일)

    // 일요일(0)이면 월요일(1) 기준에서 6일을 빼야 하므로 예외 처리
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday); // 이번 주 월요일

    const weekDates = [];

    // 월요일부터 일요일까지 7일간의 날짜를 배열에 추가
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      // YYYY-MM-DD 형식으로 포맷팅
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const date = String(currentDate.getDate()).padStart(2, "0");

      weekDates.push(`${year}-${month}-${date}`);
    }

    return weekDates;
  }

  // 한국의 시작일자, 끝일자를 받아서 MongoDB의 UTC 형태로된 cteateAt 날짜를 쿼리하기 위해 UTC 날짜로 변경
  function getUTCDate(startDate, endDate) {
    // startDate = "2026-04-01";
    // endDate = "2026-04-30";
    const sDate = new Date(startDate + "T00:00:00+09:00");
    const eDate = new Date(endDate + "T23:59:59.999+09:00");

    return { startDate: sDate.toUTCString(), endDate: eDate.toUTCString() };
  }
  
  try {

    let companyCount;
    let salesCount;

    if (mainUser) {
      companyCount = await CompanyData.countDocuments({ userId: mainUser._id, companion: userName });
    } else {
      companyCount = await CompanyData.countDocuments({ userId });
    }

    if (mainUser) {
      salesCount = await CompanyData.aggregate([
        { $match: { userId: mainUser._id, companion: userName } },
        {
          $group: {
            _id: null,
            total_sum: { $sum: { $size: { $ifNull: ["$sales", []] } } },
          },
        },
      ]);
    } else {
      salesCount = await CompanyData.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            total_sum: { $sum: { $size: { $ifNull: ["$sales", []] } } },
          },
        },
      ]);
    }

    const week = getCurrentWeek()

    let startDate = new Date(week[0] + "T00:00:00.000+09:00").toISOString();
    let endDate = new Date(week[6] + "T23:59:59.999+09:00").toISOString();

    let weekCompanyCount;
    let weekSalesCount;

    if (mainUser) {
      weekCompanyCount = await CompanyData.countDocuments({
        userId: mainUser._id,
        companion: userName,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });
  
      weekSalesCount = await CompanyData.aggregate([
        {
          $match: {
            userId: mainUser._id,
            companion: userName
          },
        },
        {
          $project: {
            matchingCount: {
              $size: {
                $filter: {
                  input: "$sales",
                  as: "sale",
                  cond: {
                    $and: [
                      {
                        $gte: ["$$sale.date", startDate],
                      },
                      {
                        $lte: ["$$sale.date", endDate],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSalesCount: { $sum: "$matchingCount" },
          },
        },
      ]);
    } else {
      weekCompanyCount = await CompanyData.countDocuments({
        userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      weekSalesCount = await CompanyData.aggregate([
        {
          $match: {
            userId,
          },
        },
        {
          $project: {
            matchingCount: {
              $size: {
                $filter: {
                  input: "$sales",
                  as: "sale",
                  cond: {
                    $and: [
                      {
                        $gte: ["$$sale.date", startDate],
                      },
                      {
                        $lte: ["$$sale.date", endDate],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalSalesCount: { $sum: "$matchingCount" },
          },
        },
      ]);
    }
  
    const monthList = []
    const months = []
    const monthCompany = []
    const monthSales = []

    for (let i = 0; i < 3; i++) {
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() - i;
      months.unshift(currentMonth+1)

      // 1. 첫째 날 객체 생성 (일자에 1 입력)
      const firstDate = new Date(currentYear, currentMonth, 1);

      // 2. 마지막 날 객체 생성 (다음 달의 0번째 날 = 이번 달의 마지막 날)
      const lastDate = new Date(currentYear, currentMonth + 1, 0);

      monthList.push({ firstDate, lastDate });
    }

    monthList.sort((a, b) => a.firstDate - b.firstDate);

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const monthResult = monthList.map((item) => ({
      firstDay: formatDate(item.firstDate),
      lastDay: formatDate(item.lastDate),
    }));

    const mResult = []

    let monthCompanyCount
    let monthSalesCount;

    for (let i = 0; i < 3; i++) {
      startDate = new Date(monthResult[i].firstDay + "T00:00:00.000+09:00").toISOString();
      endDate = new Date(monthResult[i].lastDay + "T23:59:59.999+09:00").toISOString();

      if (mainUser) {
        monthCompanyCount = await CompanyData.countDocuments({
          userId: mainUser._id,
          companion: userName,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        });
  
        monthSalesCount = await CompanyData.aggregate([
          {
            $match: {
              userId: mainUser._id,
              companion: userName
            },
          },
          {
            $project: {
              matchingCount: {
                $size: {
                  $filter: {
                    input: "$sales",
                    as: "sale",
                    cond: {
                      $and: [
                        {
                          $gte: ["$$sale.date", startDate],
                        },
                        {
                          $lte: ["$$sale.date", endDate],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: null,
              totalSalesCount: { $sum: "$matchingCount" },
            },
          },
        ]);
      } else {
        monthCompanyCount = await CompanyData.countDocuments({
          userId,
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        });
  
        monthSalesCount = await CompanyData.aggregate([
          {
            $match: {
              userId,
            },
          },
          {
            $project: {
              matchingCount: {
                $size: {
                  $filter: {
                    input: "$sales",
                    as: "sale",
                    cond: {
                      $and: [
                        {
                          $gte: ["$$sale.date", startDate],
                        },
                        {
                          $lte: ["$$sale.date", endDate],
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          {

            $group: {
              _id: null,
              totalSalesCount: { $sum: "$matchingCount" },
            },
          },
        ]);
      }
          monthCompany.push(monthCompanyCount);
          monthSales.push(monthSalesCount[0]?.totalSalesCount);
          mResult.push({ monthCompanyCount, monthSalesCount: monthSalesCount[0]?.totalSalesCount });
    }

    res
      .status(201)
      .json({
        companyCount,
        salesCount: salesCount[0]?.total_sum,
        weekCompanyCount,
        weekSalesCount: weekSalesCount[0]?.totalSalesCount,
        months,
        monthCompany,
        monthSales
      });

  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const saveCompany = async (req, res) => {
  try {
    const {
      userId,
      companyName,
      registNo,
      ceo,
      age,
      companyType,
      salesType,
      employees,
      grossRevenue,
      netProfit,
      suspenseAccount,
      retainedEarnings,
      industry,
      address,
      phone,
      groupInsu,
      companyInsu,
      companion,
      group,
      status,
    } = req.body;

    const reqData = {
      userId,
      companyName,
      registNo,
      ceo,
      age,
      companyType,
      salesType,
      employees,
      grossRevenue,
      netProfit,
      suspenseAccount,
      retainedEarnings,
      industry,
      address,
      phone,
      groupInsu,
      companyInsu,
      companion,
      group,
      status,
      sales: [],
    };

    if (companyName !== "" && registNo === "") {
      const company = await CompanyData.findOne({ userId, companyName });
      if (company) {
        res
          .status(409)
          .json({ msg: "동일한 이름으로 등록된 업체가 이미 있습니다" });
        return;
      }
    }

    if (registNo !== "") {
      const company = await CompanyData.findOne({ userId, registNo });
      if (company) {
        res.status(409).json({ msg: "이미 등록된 사업자등록번호입니다" });
        return;
      }
    }

    const data = new CompanyData(reqData);
    const saved = await data.save();
    res.status(201).json(saved);

  } catch (err) {
    res.status(500).json(err.message);
  }
}

export const getCompanies = async (req, res) => {

  const {
    userId,
    userName,
    searchWhat,
    companyRegistNo,
    exceptEnd,
    region1,
    region2,
    region3,
    salesType,
    status,
    companion,
    group,
    mainUser
  } = req.body;

  try {
    let query
      
    if (mainUser) {
      query = {
        userId: mainUser._id,
        $and: [],
      };
    } else {
      query = {
        userId: userId,
        $and: [],
      };
    }

    if (searchWhat === "companyName") {
      if (companyRegistNo !== "")
        query.companyName = {
          $regex: companyRegistNo,
          $options: "i",
        };
    } else if (searchWhat === "registNo") {
      if (companyRegistNo !== "") query.registNo = companyRegistNo;
    }

    query.$and.push({ address: { $regex: region1, $options: "i" } });
    query.$and.push({ address: { $regex: region2, $options: "i" } });
    query.$and.push({ address: { $regex: region3, $options: "i" } });

    if (exceptEnd === "종료제외") {
      if (status === "전체") query.status = { $ne: "종료" };
      else query.status = status;
    } else {
      if (status !== "전체") query.status = status;
    }

    if (salesType !== "전체") {
      query.salesType = salesType;
    }

    if (mainUser) {
      query.companion = userName;
      if (group !== "전체") {
        query.group = group;
      }
    } else {
      if (companion === "미지정") {
        query.companion = "";
      } else {
        if (companion !== "전체") {
          query.companion = companion;
        }
        if (group !== "전체") {
          query.group = group;
        }
      }
    }

    const count = await CompanyData.countDocuments(query);
    const companies = await CompanyData.find(query)
    .sort({ createdAt: -1 })
    .limit(100);

    res.status(201).json({ companies, count });
  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const updateCompany = async (req, res) => {
  try {
    const {
      userId,
      companyId,
      originalCompanyName,
      companyName,
      originalRegistNo,
      registNo,
      ceo,
      age,
      companyType,
      salesType,
      employees,
      grossRevenue,
      netProfit,
      suspenseAccount,
      retainedEarnings,
      industry,
      address,
      phone,
      groupInsu,
      companyInsu,
      companion,
      group,
      status,
    } = req.body;

    const reqData = {
      userId,
      companyId,
      companyName,
      registNo,
      ceo,
      age,
      companyType,
      salesType,
      employees,
      grossRevenue,
      netProfit,
      suspenseAccount,
      retainedEarnings,
      industry,
      address,
      phone,
      groupInsu,
      companyInsu,
      companion,
      group,
      status,
    };

    if (originalCompanyName !== companyName) {
      const company = await CompanyData.findOne({ userId, companyName });
      if (company) {
        res
          .status(409)
          .json({ msg: "동일한 이름으로 등록된 업체가 이미 있습니다" });
        return;
      }
    }

    if (registNo !== "" && originalRegistNo !== registNo) {
      const company = await CompanyData.findOne({ userId, registNo });
      if (company) {
        res.status(409).json({ msg: "이미 등록된 사업자등록번호입니다" });
        return;
      }
    }

    const updated = await CompanyData.findByIdAndUpdate(companyId, reqData, {
      new: true,
    });
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json(err.message);
  }
}

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    const deleted = await CompanyData.findByIdAndDelete(companyId);

    res.status(201).json(deleted);
  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const companyVerify = async (req, res) => {

  const { userId, companyName, registNo } = req.body;

  try {
    if (companyName !== "" && registNo === "") {
      const exist = await CompanyData.exists({ userId, companyName });
      if (exist) {
        throw new Error("동일한 이름의 업체가 이미 등록되어 있습니다")
      }
    } else if (companyName !== "" && registNo !== "") {
      const exist = await CompanyData.exists({ userId, companyName, registNo });
      if (exist) {
        throw new Error("동일한 사업자등록번호의 업체가 이미 등록되어 있습니다")
      }
    }
    res.status(200).json({msg: "등록 가능한 업체입니다"});
  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const addCompanion = async (req, res) => {
  try {

    const { userId, companion } = req.body

    const newCompanion = await User.findByIdAndUpdate(
      userId,
      { $push: { companion: {name: companion, groups: ["미지정"]} } },
      { new: true }
    )
    res.status(200).json(newCompanion);

  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const deleteCompanion = async (req, res) => {
  try {

    const { userId, companion} = req.body

    const isExist = await CompanyData.exists({
      userId,
      companion: companion,
    });

    if (isExist !== null) {
      throw new Error("업체 정보에 이미 사용된 공동영업자는 삭제할 수 없습니다.\n먼저 업체정보를 모두 삭제해야 합니다.")
    }

    const newCompanion = await User.findByIdAndUpdate(
      {_id: userId},
      { $pull: { companion: {name: companion} } },
      { new: true }
    )
    res.status(200).json(newCompanion);

  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const addGroup = async (req, res) => {
  try {

    const { userId, companion, group } = req.body

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        "companion.name": companion
       },
      {
        $push: {"companion.$.groups": group},
      },
      { new: true },
    );

    res.status(200).json(updatedUser);

  } catch (err) {
    res.status(409).json(err.message);
  }
}

export const deleteGroup = async (req, res) => {
  try {

    const { userId, companion, group } = req.body

    const isExist = await CompanyData.exists(
      {
        userId,
        companion,
        group
      }
    )

    if (isExist !== null) {
      throw new Error("업체 정보에 이미 사용된 그룹은 삭제할 수 없습니다.")
    }

    const newGroup = await User.findOneAndUpdate(
      {
        _id: userId,
        "companion.name": companion
      },
      { $pull: {"companion.$.groups": group} },
      { new: true },
    );

    res.status(200).json(newGroup);

  } catch (err) {
    res.status(409).json(err.message);
  }
};

export const createReport = async (req, res) => {
  try {

    const { userId, userName, companion, mainUser } = req.body

    let query
    let categories;

    if (mainUser) {
      categories = await CompanyData.aggregate([
        {
          $match: { userId: mainUser._id, companion: userName },
        },
        {
          $group: {
            _id: "$group",
            documents: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);
    } else {
      categories = await CompanyData.aggregate([
        {
          $match: { userId: userId, companion: companion },
        },
        {
          $group: {
            _id: "$group",
            documents: { $push: "$$ROOT" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ]);
    }

    res.status(200).json(categories);

  } catch (err) {
    res.status(404).json(err.message);
  }
};

export const uploadCompanies = async (req, res) => {

  const {
    userId,
    data,
    mode,
    companion,
    group,
    salesType
  } = req.body;

  try {

    if (mode === "new") {
      const updatedUser = await User.findOneAndUpdate(
        {
          userId,
          "companion.name": companion,
        },
        {
          $push: { "companion.$.groups": group },
        },
        { new: true },
      );
    }

    const newData = await Promise.all(
      data.map(async (item) => {
        return await CompanyData.updateOne(
          {
            userId,
            companyName: item[0],
            registNo: item[11],
          }, // 중복 기준 필드
          {
            $setOnInsert: {
              userId,
              companyName: item[0],
              ceo: item[1],
              age: item[2],
              companyType: item[3],
              employees: item[4],
              grossRevenue: item[5],
              netProfit: item[6],
              suspenseAccount: item[7],
              retainedEarnings: item[8],
              groupInsu: item[9],
              companyInsu: item[10],
              registNo: item[11],
              industry: item[12],
              address: item[13],
              phone: item[14],
              salesType: salesType,
              status: "등록",
              companion: companion,
              group: group,
            },
          }, // 데이터가 없을 때만 삽입할 내용
          { new: true, upsert: true },
        );
      }),
    );

    res.status(200).json(newData);
  } catch (err) {
    res.status(404).json(err.message);
  }
};
export const getMainUsers = async (req, res) => {

  const {
    userId,
    userName  
  } = req.body;

  try {

    const mainUsers = await User.find({
      "companion.name": userName,
    });

    res.status(200).json(mainUsers);
  } catch (err) {
    res.status(404).json(err.message);
  }
};

export const getAllUsers = async (req, res) => {

  try {

    const allUsers = await User.find().sort({createdAt: 1});

    res.status(200).json(allUsers);
  } catch (err) {
    res.status(404).json(err.message);
  }
};

export const updateApproval = async (req, res) => {

  const { user } = req.body

  try {

    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        approval: user.approval
      },
      {
        new: true
      }
    )

    res.status(200).json(updated);
  } catch (err) {
    res.status(404).json(err.message);
  }
};

export const updateSuspended = async (req, res) => {

  const { user } = req.body
  
  try {
    
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
      },
      {
        suspended: user.suspended,
      },
      {
        new: true,
      },
    );
    
    res.status(200).json(updated);
  } catch (err) {
    res.status(404).json(err.message);
  }
};

