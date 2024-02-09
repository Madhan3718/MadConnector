const express=require('express');
const router=express.Router();
const request=require('request');
const auth=require('../../middleware/auth');
const config=require('config');
const { check, validationResult } = require('express-validator');


const User=require('../../models/User');
const Profile=require('../../models/Profile');

// GET api/profile/me

router.get('/me',auth,async (req,res) => {
    try{

    const profile=await Profile.findOne({ user:req.user.id}).populate('user',['name','avatar']);
         
    if(!profile){
        return res.status(400).json({msg: 'There is no profile for user'});
    }
     res.json(profile);
    }
    catch(err){
    console.error(err.message);
    res.status(500).send('Server Error');  
    }
});

//POST api/Profile
//create user profile

router.post(
    '/',
    [auth,
    [
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty(),
    ]
],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const {
        company,
        website,
        location,
        bio,
        status,
        skills,
        githubusername,
        youtube,
        twitter,
        instagram,
        linkedin,
        facebook }=req.body;

        //Build profile object
        const profileFields={};
        profileFields.user=req.user.id;
        if(company) profileFields.company=company;
        if(website) profileFields.website=website;
        if(location) profileFields.location=location;
        if(bio) profileFields.bio=bio;
        if(status) profileFields.status=status;
        if(githubusername) profileFields.githubusername=githubusername;
        if(skills){
            profileFields.skills=skills.split(',').map(skill =>skill.trim());
        }

        console.log(profileFields.skills);


        profileFields.social={};
        if(youtube) profileFields.social.youtube= youtube;
        if(twitter) profileFields.social.twitter= twitter;
        if(facebook) profileFields.social.facebook= facebook;
        if(linkedin) profileFields.social.linkedin= linkedin;
        if(instagram) profileFields.social.instagram= instagram;
       
        try{
            let profile=await Profile.findOne({user:req.user.id});
            if(profile){
                profile=await Profile.findOneAndUpdate(

                    {user: req.user.id},
                    {$set:profileFields},
                    {new:true});

                    return res.json(profile);
            }

            profile=new Profile(profileFields);
            await profile.save();
            res.json(profile);
        }catch(err){
            console.error(err.message);
            res.status(500).send('server Error');
        }
     }
 );

 // GET api/profile
 // Get all profiles

 router.get('/', async (req, res) => {
    try {
      const profiles = await Profile.find().populate('user', ['name', 'avatar']);
      res.json(profiles);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });


  // @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
    '/user/:user_id',
    async (req, res) => {
      try {
        const profile = await Profile.findOne({
          user: req.params.user_id
        }).populate('user', ['name', 'avatar']);
  
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });
  
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        return res.status(500).json({ msg: 'Server error' });
      }
    }
  );

  // @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
    try {
      // Remove user posts
      // Remove profile
      // Remove user
      //await Promise.all([
     //Post.deleteMany({ user: req.user.id }),
        await Profile.findOneAndRemove({ user: req.user.id });
       await  User.findOneAndRemove({ _id: req.user.id });
      
  
      res.json({ msg: 'User deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

  // @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
  '/experience',[
  auth,[
  check('title', 'Title is required').notEmpty(),
  check('company', 'Company is required').notEmpty(),
  check('from', 'From date is required and needs to be from the past')
    .notEmpty()
  ]
],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }=req.body;

    const newExp={
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//    DELETE api/profile/experience/:exp_id
//     Delete experience from profile


router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
   
    //Get remove index
    const removeIndex= profile.experience.map(item =>item.id).indexOf(req.params.exp_id );
    profile.experience.splice(removeIndex,1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

//    PUT api/profile/education
//     Add profile education

router.put(
  '/education',[
  auth,[
  check('school', 'School is required').notEmpty(),
  check('degree', 'Degree is required').notEmpty(),
  check('fieldofstudy', 'Field of study is required').notEmpty(),
  check('from', 'From date is required and needs to be from the past')
    .notEmpty()
  ]
],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,from,to,current,description
    }=req.body;

    const newEdu={
      school,
      degree,
      fieldofstudy,from,to,current,description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//    DELETE api/profile/education/:edu_id
//     Delete education from profile


router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
   
    //Get remove index
    const removeIndex= profile.education.map(item =>item.id).indexOf(req.params.edu_id );
    educationprofile.splice(removeIndex,1);

    await profile.save();
    res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route    GET api/profile/github/:username
// @desc     Get user repos from Github

router.get('/github/:username', async (req, res) => {
  try {
    const options={uri:
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
    
    method:'GET',
    headers:{
      'user-agent': 'node.js'}
    };

    request(options,(error,response,body) =>{
      if(error) console.error(error);

      if(response.statusCode!=200){
        return res.status(404).json({msg:'No Github profile found'});
      }
      res.json(JSON.parse(body));

    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports=router;