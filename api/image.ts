import express, { query } from "express";
import { conn } from "../dbconnect";

// router = ตัวจัดการเส้นทาง
export const router = express.Router();

// โชว์หมด
router.get("/", (req, res)=>{
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send("Method GET in trip.ts with" + id);
    }else{
      const sql = 'select * from image';
      conn.query(sql, (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
      })
    }
});

// /trip/
router.get("/:id", (req, res)=>{
    const id = req.params.id;
    //bad
    // const sql = "select * from trip where idx = "+ id;
    // good
    const sql = "select * from image where mid = ?";

    conn.query(sql, [id], (err,result)=>{
        if (err) {
            res.status(400).json(err);
        } else {
            res.json(result);
        }
      })
    // res.send("Method GET in trip.ts" + id);
});

// POST /trip
router.post("/", (req, res)=>{
    let body = req.body; 
    res.send("Get in trip.ts body: " + JSON.stringify(body));

});

router.get("/search/fields", (req, res)=>{
    const id = req.query.id;
    // conts name = req,query.name;
    const sql = "select * from trip where "+" (idx IS NULL OR idx = ?) OR (name IS NULL OR name like ?)";
    conn.query(sql, [id, "s", name, "s"], (err, result)=>{
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    })
});

router.get("/search/mon", (req, res)=>{
    const id =req.query.id;
    const price = req.query.price;
    const sql = "select * from trip where "+" (idx IS NULL OR idx = ?) OR (name IS NULL OR name like ?)";
    conn.query(sql, [id, "s", name, "s",price], (err, result)=>{
        if (err) {
            res.json(err);
        } else {
            res.json(result);
        }
    })
});

router.get("/pic/random", (req, res)=>{
    if (req.query.id) {
        const id = req.query.id;
        const name = req.query.name;
        res.send("Method GET in image.ts with" + id);
    } else {
        const sql = 'select * from image';
        conn.query(sql, (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                const images = result.map((item: any) => item.mid); // ดึง mid ทั้งหมดจากผลลัพธ์ของคำสั่ง SQL
                let randomMid1 = getRandomMid(images); // สุ่ม mid ครั้งแรก
                let randomMid2 = getRandomMid(images); // สุ่ม mid ครั้งที่สอง

                // ตรวจสอบและสุ่มใหม่ถ้า mid ซ้ำกัน
                while (randomMid1 === randomMid2) {
                    randomMid2 = getRandomMid(images);
                }

                // Query ข้อมูลของ randomMid1 และ randomMid2 พร้อมกัน
                const sqlQuery = 'SELECT * FROM image WHERE mid = ? OR mid = ?';
                conn.query(sqlQuery, [randomMid1, randomMid2], (err, combinedResult) => {
                if (err) {
                    res.status(400).json(err);
                } else {
                    // สร้าง JSON object ที่มีข้อมูลของทั้ง randomMid1 และ randomMid2
                    const response = {
                        0: combinedResult.find((item: any) => item.mid === randomMid1),
                        1: combinedResult.find((item: any) => item.mid === randomMid2)
                    };
                res.json(response); // ส่งผลลัพธ์กลับ
                }
                });
        }
        })
    }
});

function getRandomMid(images: any[]) {
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
}