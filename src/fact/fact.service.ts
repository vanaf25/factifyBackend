import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';
import { InjectModel } from "@nestjs/mongoose";
import { Fact, FactDocument } from "./fact.schema";
import { Model } from "mongoose";
import { UserService } from "../user/user.service";
import { SettingsService } from "../settings/settings.service";
/*
function parseContent(content) {
  const parsedObject = {
    truthStatus: "",
    severity: "",
    keyFacts: [],
    references: [],
    explanation: ""
  };
  content = content.replace(/\*\*!/g, '');
  // Extracting truth status
  const truthStatusMatch = content.match(/Truth Status:\s*(\w+)/);
  if (truthStatusMatch) {
    parsedObject.truthStatus = truthStatusMatch[1].toLowerCase();
  }

  // Extracting severity
  const severityMatch = content.match(/Severity:\s*(\w+)/);
  if (severityMatch) {
    parsedObject.severity = severityMatch[1].toLowerCase();
  }

  // Extracting explanation
  const explanationMatch = content.match(/Explanation:\s*([\s\S]*?)\s*Key Facts:/);
  if (explanationMatch) {
    parsedObject.explanation = explanationMatch[1].trim();
  }

  // Extracting key facts
  const keyFactsMatch = content.match(/Key Facts:\s*([\s\S]*?)\s*References:/);
  if (keyFactsMatch) {
    parsedObject.keyFacts = keyFactsMatch[1]
      .trim()
      .split(/\n\d+\.\s*!/)
      .filter(fact => fact);  // Removes any empty elements from splitting
  }

  // Extracting references
  const referencesMatch = content.match(/References:\s*([\s\S]*)/);
  if (referencesMatch) {
    parsedObject.references = referencesMatch[1]
      .trim()
      .split(/\n\d+\.\s*!/)
      .filter(reference => reference);
  }

  return parsedObject;
}
*/
@Injectable()
export class FactService {
  constructor(
    @InjectModel(Fact.name) private factModel: Model<FactDocument>,
    @Inject(forwardRef(() => UserService))
    private readonly usersService: UserService,
    private readonly settingsService:SettingsService
  ) {
  }
  async create(createFactDto: CreateFactDto,userId:string) {
    try{
      const settingsData=await this.settingsService.getSettings();
      const apiKey=settingsData?.apiKey || "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";
      const prompt=settingsData?.prompt  || `
   Output must be in JSON format.



You are a multilingual fact-checking assistant using the Sonar models. Your primary tasks are:
1. Detect the language of the given text.
2. Respond in the same language as the detected language of the input text.
3. Focus specifically on fact-checking the input text.
4. Find and provide reliable sources for the claims in the selected text, ensuring they are from different domains accessible via the Sonar models and strictly related to the subject.
5. Aim to provide 5-10 sources, prioritizing the diversity of domains from credible public sources available to the API. Do not invent sources or include unrelated sources.
6. Provide a truth percentage based on the reliability and consensus of the sources. The percentage should reflect how well the input text is supported by the sources, not the number of sources found.
7. Write a fact check that includes an explanation of the claim's accuracy (200 to 300 words). The explanation should address the relevant context surrounding the claim.
8. Include key facts that summarize critical information supporting the claim.
9. Provide references in a clear list format, ensuring they are from reliable sources.
Format your response EXACTLY as follows, in the detected language:
factCheckDetails
explanation: [detailed explanation (200 to 300 words)].
truthStatus: [True/False/Half true/Misleading] - provide value depending on the fact's accuracy, based on the sources provided.
severity: [Low/Medium/High]
keyFacts:
1. [Key fact 1]
2. [Key fact 2]
3. [Key fact 3]
references:
1. [title](url)
2. [title](url)
Output must be in JSON format.
Here is the template of the expected JSON format:
{
"factCheckDetails": {
"explanation": "",
"truthStatus": "",
"severity": "",
"keyFacts": [



],
"references": [
{title:url},
{title:url}
]
}
}
     `
      const options = {
        method: 'POST',
        headers: {Authorization: `Bearer ${apiKey} `, 'Content-Type': 'application/json'},
        body:JSON.stringify( {
          "model":"llama-3.1-sonar-small-128k-online",
          "messages":[
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: createFactDto.fact
            }
          ]
        }
        ),
      };
      const response = await fetch('https://api.perplexity.ai/chat/completions', options);
      const data = await response.json();
      const content = data.choices[0].message.content;
      console.log('initial Content:',content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      console.log('jsonMathc:',jsonMatch);
      if (!jsonMatch) {
        throw new BadRequestException("Something went wrong!")
      }
      const obj =JSON.parse(jsonMatch[0]);
      console.log('obj:',obj);
      const currentObj=obj
      const user = await this.usersService.findById2(userId);
      const upd={
        ...currentObj,
        title:createFactDto.fact,
        user:user._id}
      const newFact=new this.factModel(upd);
      const savedFact = await newFact.save();
      await this.usersService.makeSearch(userId,savedFact._id as string);
      return savedFact;
    }
    catch (e){
      console.log('som:',e);
      throw new BadRequestException("Something went wrong!")
    }
  }
  findAll() {
    return `This action returns all fact`;
  }
    async findById(id:string){
      const fact = await this.factModel
        .findById(id).populate('favoriteUsers');
      if(!fact) throw new NotFoundException("Fact was not founded")
      return fact
    }
  findOne(id: number) {
    return `This action returns a #${id} fact`;
  }

  update(id: number, updateFactDto: UpdateFactDto) {
    console.log(updateFactDto);
    return `This action updates a #${id} fact`;
  }

  remove(id: number) {
    return `This action removes a #${id} fact`;
  }
  async deleteFact(factId: string, userId: string): Promise<{ message: string }> {
    const fact = await this.factModel.findById(factId).exec();
    const user=await this.usersService.findById2(userId);
    if (!fact) {
      throw new NotFoundException('Fact not found');
    }
    user.facts=user.facts.filter(fact=>fact.toString()!==factId)
    // Ensure the user who is requesting the delete owns the fact
    if (fact.user.toString() !== userId) {
      throw new NotFoundException('You do not have permission to delete this fact');
    }
    await user.save();
    // Remove the fact from any user's facts list
    return { message: 'Fact successfully deleted' };
  }
}
