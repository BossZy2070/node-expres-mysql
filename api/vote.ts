import express, { query } from "express";
import { conn } from "../dbconnect";


// router = ตัวจัดการเส้นทาง
export const router = express.Router();

router.use(express.json());

router.use(express.urlencoded({ extended: true }));

// นับโหวต
router.get("/count", (req, res)=>{
    const id = req.query.mid as string;
    
    // ดึงค่าปัจจุบันของ vote_count จากฐานข้อมูล
    const getSql = "SELECT vote_count FROM vote WHERE mid = ?";
    conn.query(getSql, [id], (err, result) => {
        if (err) {
            res.status(400).json(err);
        } else {
            if (result.length > 0) {
                const currentVoteCount = result[0].vote_count;
                
                // อัปเดตค่า vote_count ในฐานข้อมูลโดยเพิ่มขึ้นอีก 1
                const updateSql = "UPDATE vote SET vote_count = ? WHERE mid = ?";
                
                // เพิ่มค่า vote_count ขึ้น 1
                const newVoteCount = currentVoteCount + 1;

                conn.query(updateSql, [newVoteCount, id], (err, result) => {
                    if (err) {
                        res.status(400).json(err);
                    } else {
                        res.json({ message: "Vote count updated successfully" });
                    }
                });                
            } else {
                res.status(404).json({ message: "Image not found" });
            }
        }
    });
});


router.get("/test", (req, res)=>{
    const today: Date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate: string = today.toLocaleDateString('en-US', options);
    // const formattedDate: string = today.toLocaleDateString('th-TH', options);
    
    res.json(formattedDate);
    
});

// ระบบ elo rating
router.put("/", (req, res) => {
    let details = {
        mid1: req.body.mid1,
        mid2: req.body.mid2,
        win: req.body.win,
    };

    // สร้างตัวแปรสำหรับเก็บวันที่และเวลาปัจจุบัน
    let date = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (details.win == details.mid1) {
        const sqlCheck = 'SELECT rating FROM vote WHERE mid = ? OR mid = ?';
        conn.query(sqlCheck, [details.mid1, details.mid2], (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                if (result.length >= 2) {
                    let player1Rating = result[0].rating;
                    let player2Rating = result[1].rating;
                    
                    // คำนวณคะแนน ELO rating ใหม่
                    let eloChange = calculateEloRatingA(player1Rating, player2Rating);
                    let player1NewRating = Math.round(player1Rating + eloChange);
                    let player2NewRating = Math.round(player2Rating - eloChange);

                    const sqlUpdateMid1 = "UPDATE vote SET rating = ?, date = ? WHERE mid = ?";
                    const sqlUpdateMid2 = "UPDATE vote SET rating = ?, date = ? WHERE mid = ?";

                    // Update mid1
                    conn.query(sqlUpdateMid1, [player1NewRating, date, details.mid1], (errorMid1, resultMid1) => {
                        if (errorMid1) {
                            res.status(400).json({ status: false, message: "Failed to update ratings for mid1", error: errorMid1 });
                        } else {
                            // Update mid2
                            conn.query(sqlUpdateMid2, [player2NewRating, date, details.mid2], (errorMid2, resultMid2) => {
                                if (errorMid2) {
                                    res.status(400).json({ status: false, message: "Failed to update ratings for mid2", error: errorMid2 });
                                } else {
                                    res.json({ status: true, message: "Ratings updated successfully for both mid1 and mid2" });
                                }
                            });
                        }
                    });

                } else {
                    res.status(404).json({ status: false, message: "Insufficient data for both players" });
                }
            }
        });
    }
    
    else if (details.win == details.mid2) {
        const sqlCheck = 'SELECT rating FROM vote WHERE mid = ? OR mid = ?';
        conn.query(sqlCheck, [details.mid2, details.mid1], (err, result) => {
            if (err) {
                res.status(400).json(err);
            } else {
                if (result.length >= 2) {
                    let player1Rating = result[0].rating;
                    let player2Rating = result[1].rating;
                    
                    // คำนวณคะแนน ELO rating ใหม่
                    let eloChange = calculateEloRatingB(player1Rating, player2Rating);
                    let player1NewRating = Math.round(player1Rating - eloChange);
                    let player2NewRating = Math.round(player2Rating + eloChange);
    
                    const sqlUpdateMid1 = "UPDATE vote SET rating = ?, date = ? WHERE mid = ?";
                    const sqlUpdateMid2 = "UPDATE vote SET rating = ?, date = ? WHERE mid = ?";
    
                    // Update mid1
                    conn.query(sqlUpdateMid1, [player1NewRating, date, details.mid2], (errorMid1, resultMid1) => {
                        if (errorMid1) {
                            res.status(400).json({ status: false, message: "Failed to update ratings for mid1", error: errorMid1 });
                        } else {
                            // Update mid2
                            conn.query(sqlUpdateMid2, [player2NewRating, date, details.mid1], (errorMid2, resultMid2) => {
                                if (errorMid2) {
                                    res.status(400).json({ status: false, message: "Failed to update ratings for mid2", error: errorMid2 });
                                } else {
                                    res.json({ status: true, message: "Ratings updated successfully for both mid1 and mid2" });
                                }
                            });
                        }
                    });
    
                } else {
                    res.status(404).json({ status: false, message: "Insufficient data for both players" });
                }
            }
        });
    }
});

function calculateEloRatingA(ra: number, rb: number): number {
    const kFactor = 32;
    const expectedScoreA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
    return kFactor * (1 - expectedScoreA);
}
function calculateEloRatingB(ra: number, rb: number): number {
    const kFactor = 32;
    const expectedScoreA = 1 / (1 + Math.pow(10, (ra - rb) / 400));
    return kFactor * (1 - expectedScoreA);
}